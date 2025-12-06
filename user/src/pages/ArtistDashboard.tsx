import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Music, UploadCloud, Settings, LogOut, User,
  PlayCircle, Disc, Search, Trash2, Edit, Plus,
  Image as ImageIcon, Calendar, CheckCircle2, X, Save, ListMusic,
  Loader2, MoreVertical, Play, MinusCircle
} from "lucide-react";

// --- CẤU HÌNH API & CLOUDINARY ---
const API_BASE_URL = "http://localhost:3000"; 
const USE_MOCK_API = false; 

// [QUAN TRỌNG] HÃY THAY ĐỔI THÔNG TIN CỦA BẠN Ở ĐÂY
const CLOUDINARY_CLOUD_NAME = "dy9odkj0j"; // Cloud Name của bạn
const CLOUDINARY_UPLOAD_PRESET = "music-app-upload"; // Upload Preset của bạn

// --- MAPPING GENRE ---
const GENRE_MAP: Record<string, number> = {
    "Pop": 1,
    "Ballad": 2,
    "Rap/Hip-hop": 3,
    "Indie": 4,
    "R&B": 5
};

// --- HELPER: UPLOAD LÊN CLOUDINARY ---
const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Lỗi upload ảnh lên Cloudinary");
    }
    
    const data = await res.json();
    return data.secure_url; 
  } catch (error) {
    console.error("Cloudinary Error:", error);
    throw error;
  }
};

// --- TYPES ---
interface Song {
  id: number | string;
  title: string;
  plays: string | number;
  duration: string;
  status: string;
  releaseDate?: string; 
  albumId?: number | string | null;
  genreId?: number;     
  genre?: string;       
  coverImage?: string;  
  cover?: string;       
  audioUrl?: string; 
  artist?: string; 
  description?: string; 
}

interface Album {
  id: number | string;
  title: string;
  year: string;
  desc?: string;
  description?: string;
  cover: string;
  coverImage?: string;
}

interface Playlist {
  id: number | string;
  title: string;
  desc?: string;
  cover?: string;
  songs: (number | string)[]; 
}

// --- API HELPER FUNCTIONS ---
const apiService = {
    getDashboard: async () => {
        if (USE_MOCK_API) return { stats: [], albums: [], songs: [], playlists: [] };
        try {
            const [songsRes, albumsRes, playlistsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/songs`),
                fetch(`${API_BASE_URL}/albums`),
                fetch(`${API_BASE_URL}/playlists`).catch(() => ({ ok: true, json: () => [] }))
            ]);

            const songs = songsRes.ok ? await songsRes.json() : [];
            const albums = albumsRes.ok ? await albumsRes.json() : [];
            const playlists = playlistsRes.ok ? await playlistsRes.json() : [];

            return {
                stats: [
                    { label: "Tổng lượt nghe", value: "---", icon: <PlayCircle size={24} />, color: "text-blue-400" },
                    { label: "Tổng bài hát", value: songs.length, icon: <Music size={24} />, color: "text-purple-400" },
                    { label: "Tổng Album", value: albums.length, icon: <Disc size={24} />, color: "text-green-400" },
                    { label: "Playlist", value: playlists.length, icon: <ListMusic size={24} />, color: "text-pink-400" },
                ],
                songs,
                albums,
                playlists
            };
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    },

    createItem: async (endpoint: string, data: any) => {
        const isFormData = data instanceof FormData;
        const headers: HeadersInit = isFormData ? {} : { 'Content-Type': 'application/json' };
        const body = isFormData ? data : JSON.stringify(data);

        const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers: headers,
            body: body,
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Lỗi tạo ${endpoint}: ${errText}`);
        }
        return res.json();
    },

    updateItem: async (endpoint: string, id: number | string, data: any) => {
        const isFormData = data instanceof FormData;
        const headers: HeadersInit = isFormData ? {} : { 'Content-Type': 'application/json' };
        const body = isFormData ? data : JSON.stringify(data);

        const res = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
            method: 'PATCH',
            headers: headers,
            body: body,
        });
        
        if (!res.ok) {
             const errText = await res.text();
             throw new Error(`Lỗi update ${endpoint} ${id}: ${errText}`);
        }
        return res.json();
    },

    deleteItem: async (endpoint: string, id: number | string) => {
        await fetch(`${API_BASE_URL}/${endpoint}/${id}`, { method: 'DELETE' });
        return true;
    }
};

// --- COMPONENT CHÍNH ---

const ArtistDashboard = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "songs" | "albums" | "playlists" | "upload" | "settings">("dashboard");
  const [artistName, setArtistName] = useState("Artist");
  const [avatar, setAvatar] = useState("");

  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [error, setError] = useState<string | null>(null);

  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editType, setEditType] = useState<"song" | "album" | "playlist" | null>(null);

  // [MỚI] State tìm kiếm bài hát trong Playlist
  const [songSearchQuery, setSongSearchQuery] = useState("");

  // Form States
  const [songForm, setSongForm] = useState({
    title: "", 
    artist: "",     
    description: "", 
    genre: "Pop", 
    status: "Public", 
    albumId: "" as string | number,
    file: null as File | null, 
    fileName: "", 
    coverFile: null as File | null, 
    coverPreview: ""
  });

  const [albumForm, setAlbumForm] = useState({
    title: "", year: "", desc: "", coverFile: null as File | null, coverPreview: "",
    selectedSongIds: [] as (number | string)[]
  });

  const [playlistForm, setPlaylistForm] = useState({
    title: "", desc: "", coverFile: null as File | null, coverPreview: "",
    selectedSongIds: [] as (number | string)[]
  });

  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  // Refs
  const albumFileInputRef = useRef<HTMLInputElement>(null);
  const playlistFileInputRef = useRef<HTMLInputElement>(null);
  const songFileInputRef = useRef<HTMLInputElement>(null);
  const songCoverInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
        const data = await apiService.getDashboard();
        setStats(data.stats);
        setSongs(data.songs);
        setAlbums(data.albums);
        setPlaylists(data.playlists || []);
    } catch (err) {
        setError("Không thể kết nối đến máy chủ.");
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    setArtistName("Sơn Tùng M-TP (Demo)");
    setAvatar(localStorage.getItem("avatar") || "https://cdn-icons-png.flaticon.com/512/3974/3974038.png");
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  // --- LOGIC XỬ LÝ ẢNH PREVIEW ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'album' | 'playlist' | 'songCover') => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const previewUrl = URL.createObjectURL(file);
        
        if (type === 'album') setAlbumForm({ ...albumForm, coverFile: file, coverPreview: previewUrl });
        if (type === 'playlist') setPlaylistForm({ ...playlistForm, coverFile: file, coverPreview: previewUrl });
        if (type === 'songCover') setSongForm({ ...songForm, coverFile: file, coverPreview: previewUrl });
    }
  };

  const handleSongAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSongForm({ ...songForm, file: e.target.files[0], fileName: e.target.files[0].name });
    }
  };

  // --- HANDLER SAVE ALBUM ---
  const handleSaveAlbum = async () => {
    if (!albumForm.title) return alert("Cần nhập tên Album!");
    setIsSubmitting(true);

    try {
        let coverUrl = albumForm.coverPreview;
        if (albumForm.coverFile) {
            coverUrl = await uploadToCloudinary(albumForm.coverFile);
        }

        const payload = {
            title: albumForm.title,
            year: albumForm.year,
            desc: albumForm.desc,
            cover: coverUrl, 
        };

        if (editingAlbum) {
            await apiService.updateItem('albums', editingAlbum.id, payload);
            const targetAlbumId = String(editingAlbum.id);

            const songsToAdd = songs.filter(s => {
                const isSelected = albumForm.selectedSongIds.some(selId => String(selId) === String(s.id));
                const currentAlbumId = s.albumId ? String(s.albumId) : "null";
                return isSelected && currentAlbumId !== targetAlbumId;
            });

            const songsToRemove = songs.filter(s => {
                const currentAlbumId = s.albumId ? String(s.albumId) : "null";
                const isCurrentlyInThisAlbum = currentAlbumId === targetAlbumId;
                const isSelected = albumForm.selectedSongIds.some(selId => String(selId) === String(s.id));
                return isCurrentlyInThisAlbum && !isSelected;
            });

            const updatePromises = [
                ...songsToAdd.map(song => 
                    apiService.updateItem('songs', song.id, { albumId: editingAlbum.id }).catch(err => console.warn(err)) 
                ),
                ...songsToRemove.map(song => 
                    apiService.updateItem('songs', song.id, { albumId: null }).catch(err => console.warn(err))
                )
            ];

            await Promise.all(updatePromises);
            await fetchData();
            setIsEditModalOpen(false);
            setEditingAlbum(null);
            alert("Cập nhật Album thành công!");
        } else {
            await apiService.createItem('albums', payload);
            await fetchData();
            setIsCreatingAlbum(false);
            alert("Tạo Album thành công!");
        }
    } catch (err) {
        console.error(err);
        alert("Lỗi khi lưu Album: " + err);
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- HANDLER SAVE PLAYLIST ---
  const handleSavePlaylist = async () => {
      if (!playlistForm.title) return alert("Cần nhập tên Playlist!");
      setIsSubmitting(true);
      try {
          let coverUrl = playlistForm.coverPreview;
          if (playlistForm.coverFile) {
              coverUrl = await uploadToCloudinary(playlistForm.coverFile);
          }
          const payload = {
              title: playlistForm.title,
              desc: playlistForm.desc,
              cover: coverUrl,
              songs: playlistForm.selectedSongIds
          };
          if (editingPlaylist) {
              await apiService.updateItem('playlists', editingPlaylist.id, payload);
              await fetchData();
              setIsEditModalOpen(false);
              setEditingPlaylist(null);
          } else {
              await apiService.createItem('playlists', payload);
              await fetchData();
              setIsCreatingPlaylist(false);
          }
          alert("Lưu Playlist thành công!");
      } catch (err) {
          alert("Lỗi khi lưu Playlist: " + err);
      } finally {
          setIsSubmitting(false);
      }
  };

  // --- HANDLER SAVE SONG ---
  const handleSaveSong = async () => {
    if (!songForm.title) return alert("Cần nhập tên bài hát!");
    if (!editingSong && !songForm.file) return alert("Chưa chọn file nhạc!");
    
    setIsSubmitting(true);

    try {
        let finalCoverUrl = songForm.coverPreview;
        if (songForm.coverFile) {
            finalCoverUrl = await uploadToCloudinary(songForm.coverFile);
        }

        const formData = new FormData();
        if (songForm.file) formData.append("file", songForm.file);
        formData.append("title", songForm.title);
        formData.append("artist", songForm.artist || artistName); 
        formData.append("description", songForm.description);     
        formData.append("coverImage", finalCoverUrl || "");
        
        if (!editingSong) formData.append("releaseDate", new Date().toISOString().split('T')[0]);
        
        const selectedGenreId = GENRE_MAP[songForm.genre] || 1;
        formData.append("genreId", String(selectedGenreId));

        if (songForm.albumId) formData.append("albumId", String(songForm.albumId));
        else formData.append("albumId", ""); 

        if (editingSong) {
            await apiService.updateItem('songs', editingSong.id, formData);
            await fetchData();
            setIsEditModalOpen(false);
            setEditingSong(null);
            alert("Cập nhật bài hát thành công!");
        } else {
            await apiService.createItem('songs', formData);
            await fetchData();
            setSongForm({ title: "", artist: "", description: "", genre: "Pop", status: "Public", albumId: "", file: null, fileName: "", coverFile: null, coverPreview: "" });
            setActiveTab("songs");
            alert("Đăng tải bài hát thành công!");
        }
    } catch (err: any) {
        console.error(err);
        alert("Lỗi: " + err.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- UI HELPERS ---
  const openCreateAlbum = () => {
    setAlbumForm({ title: "", year: new Date().getFullYear().toString(), desc: "", coverFile: null, coverPreview: "", selectedSongIds: [] });
    setIsCreatingAlbum(true);
    setActiveTab("albums");
  };

  const openEditAlbum = (album: Album) => {
    const currentAlbumSongs = songs.filter(s => String(s.albumId) === String(album.id)).map(s => s.id);
    setEditingAlbum(album);
    setAlbumForm({
        title: album.title,
        year: album.year,
        desc: album.desc || album.description || "",
        coverFile: null,
        coverPreview: album.cover || album.coverImage || "",
        selectedSongIds: currentAlbumSongs
    });
    setEditType("album");
    setIsEditModalOpen(true);
  };

  const openCreatePlaylist = () => {
    setPlaylistForm({ title: "", desc: "", coverFile: null, coverPreview: "", selectedSongIds: [] });
    setSongSearchQuery(""); // Reset tìm kiếm
    setIsCreatingPlaylist(true);
    setActiveTab("playlists");
  };

  const openEditPlaylist = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setPlaylistForm({ title: playlist.title, desc: playlist.desc || "", coverFile: null, coverPreview: playlist.cover || "", selectedSongIds: playlist.songs || [] });
    setSongSearchQuery(""); // Reset tìm kiếm
    setEditType("playlist");
    setIsEditModalOpen(true);
  };

  const openEditSong = (song: Song) => {
    setEditingSong(song);
    const genreName = Object.keys(GENRE_MAP).find(key => GENRE_MAP[key] === song.genreId) || "Pop";
    setSongForm({ 
        title: song.title,
        artist: song.artist || "", 
        description: song.description || "", 
        genre: genreName, 
        status: song.status, 
        albumId: song.albumId || "", 
        file: null, 
        fileName: "", 
        coverFile: null, 
        coverPreview: song.coverImage || song.cover || "" 
    });
    setEditType("song");
    setIsEditModalOpen(true);
  };

  const handleDeleteItem = async (type: 'songs'|'albums'|'playlists', id: number | string) => {
    if (!confirm("Bạn có chắc muốn xóa?")) return;
    try { 
        await apiService.deleteItem(type, id); 
        if (type === 'albums') {
            const songsInAlbum = songs.filter(s => String(s.albumId) === String(id));
            for (const s of songsInAlbum) { try { await apiService.updateItem('songs', s.id, { albumId: null }); } catch(e){} }
        }
        fetchData(); 
    } catch (err) { alert("Lỗi xóa"); }
  };

  const toggleSongInAlbum = (songId: number | string) => {
    const currentIds = albumForm.selectedSongIds;
    const targetId = String(songId);
    const exists = currentIds.some(id => String(id) === targetId);
    if (exists) setAlbumForm({ ...albumForm, selectedSongIds: currentIds.filter(id => String(id) !== targetId) });
    else setAlbumForm({ ...albumForm, selectedSongIds: [...currentIds, songId] });
  };

  const toggleSongInPlaylist = (songId: number | string) => {
    const currentIds = playlistForm.selectedSongIds;
    const targetId = String(songId);
    const exists = currentIds.some(id => String(id) === targetId);
    if (exists) setPlaylistForm({ ...playlistForm, selectedSongIds: currentIds.filter(id => String(id) !== targetId) });
    else setPlaylistForm({ ...playlistForm, selectedSongIds: [...currentIds, songId] });
  };

  // --- [MỚI] COMPONENT CHỌN BÀI HÁT CHO PLAYLIST ---
  const renderPlaylistSongSelector = () => {
    // 1. Lọc bài hát theo từ khóa tìm kiếm
    const filteredSongs = songs.filter(s => 
        s.title.toLowerCase().includes(songSearchQuery.toLowerCase()) || 
        (s.artist && s.artist.toLowerCase().includes(songSearchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-4">
            {/* Danh sách ĐÃ CHỌN */}
            {playlistForm.selectedSongIds.length > 0 && (
                <div className="bg-[#151a30] border border-gray-700 rounded-lg p-3">
                    <label className="text-gray-400 font-bold text-xs uppercase mb-2 block">Đã chọn ({playlistForm.selectedSongIds.length})</label>
                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {playlistForm.selectedSongIds.map(id => {
                            const song = songs.find(s => String(s.id) === String(id));
                            if (!song) return null;
                            return (
                                <div key={id} className="flex justify-between items-center bg-[#1E2542] p-2 rounded border border-gray-600/50 group">
                                    <div className="flex items-center gap-2 truncate">
                                        <div className="w-1 h-8 bg-[#3BC8E7] rounded-full"></div>
                                        <span className="text-sm text-white truncate">{song.title}</span>
                                    </div>
                                    <button onClick={() => toggleSongInPlaylist(id)} className="text-gray-500 hover:text-red-400 p-1"><X size={16}/></button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Khu vực TÌM KIẾM và THÊM */}
            <div>
                <label className="text-gray-300 font-bold text-sm mb-2 block flex items-center gap-2">
                    <ListMusic size={16} className="text-[#3BC8E7]"/> Thêm bài hát:
                </label>
                
                {/* Search Input */}
                <div className="relative mb-2">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm bài hát..." 
                        value={songSearchQuery}
                        onChange={(e) => setSongSearchQuery(e.target.value)}
                        className="w-full bg-[#151a30] text-white pl-9 pr-3 py-2 rounded-lg border border-gray-700 focus:border-[#3BC8E7] text-sm"
                    />
                </div>

                {/* Danh sách bài hát (Lọc bỏ những bài đã chọn để đỡ rối, hoặc chỉ hiển thị trạng thái) */}
                <div className="bg-[#151a30] border border-gray-700 rounded-lg max-h-48 overflow-y-auto p-2">
                    {filteredSongs.length > 0 ? filteredSongs.map(song => {
                        const isSelected = playlistForm.selectedSongIds.some(id => String(id) === String(song.id));
                        // Nếu đã chọn rồi thì ẩn đi ở list dưới để tập trung vào việc tìm bài mới, 
                        // hoặc hiển thị mờ đi. Ở đây mình sẽ hiển thị trạng thái đã chọn.
                        return (
                            <div key={song.id} onClick={() => toggleSongInPlaylist(song.id)} className={`flex items-center p-2 rounded cursor-pointer transition border border-transparent ${isSelected ? 'opacity-50 bg-gray-800' : 'hover:bg-gray-700 hover:border-gray-600'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${isSelected ? 'bg-[#3BC8E7] text-black' : 'bg-gray-700 text-gray-400'}`}>
                                    {isSelected ? <CheckCircle2 size={14}/> : <Plus size={14}/>}
                                </div>
                                <div className="flex-1 truncate">
                                    <div className="text-sm text-gray-200">{song.title}</div>
                                    <div className="text-xs text-gray-500">{song.artist || "Unknown Artist"}</div>
                                </div>
                            </div>
                        )
                    }) : (
                        <p className="text-gray-500 text-xs text-center p-4">Không tìm thấy bài hát nào phù hợp.</p>
                    )}
                </div>
            </div>
        </div>
    );
  };

  if (isLoading) return <div className="min-h-screen bg-[#151a30] flex items-center justify-center"><Loader2 className="animate-spin text-[#3BC8E7]" size={48} /></div>;
  if (error) return <div className="min-h-screen bg-[#151a30] flex flex-col items-center justify-center text-white gap-4"><p className="text-red-500 text-xl">{error}</p><button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#3BC8E7] text-black rounded-lg">Thử lại</button></div>;

  // --- RENDER MODAL ---
  const renderEditModal = () => {
    if (!isEditModalOpen) return null;
    let title = "", Icon = Music;
    if (editType === "song") { title = "Chỉnh sửa Bài hát"; Icon = Music; }
    else if (editType === "album") { title = "Chỉnh sửa Album"; Icon = Disc; }
    else if (editType === "playlist") { title = "Chỉnh sửa Playlist"; Icon = ListMusic; }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-[#1E2542] w-full max-w-lg rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#151a30]">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><Icon className="text-[#3BC8E7]"/> {title}</h3>
                    <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
                    {editType === "song" && (
                        <>
                            <div className="flex gap-4 mb-2">
                                <div onClick={() => songCoverInputRef.current?.click()} className="w-20 h-20 bg-[#151a30] rounded-lg border border-gray-600 flex-shrink-0 flex items-center justify-center cursor-pointer overflow-hidden relative group">{songForm.coverPreview ? <img src={songForm.coverPreview} className="w-full h-full object-cover"/> : <ImageIcon className="text-gray-500"/>}<div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><Edit size={16} className="text-white"/></div><input type="file" ref={songCoverInputRef} onChange={(e) => handleFileChange(e, 'songCover')} accept="image/*" className="hidden" /></div>
                                <div className="flex-1 space-y-2">
                                    <div><label className="text-gray-400 text-sm mb-1 block">Tên bài hát</label><input type="text" value={songForm.title} onChange={(e) => setSongForm({...songForm, title: e.target.value})} className="w-full bg-[#151a30] text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-[#3BC8E7]"/></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-gray-400 text-sm mb-1 block">Thể loại</label><select value={songForm.genre} onChange={(e) => setSongForm({...songForm, genre: e.target.value})} className="w-full bg-[#151a30] text-white px-4 py-2 rounded-lg border border-gray-600">{Object.keys(GENRE_MAP).map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                                <div><label className="text-gray-400 text-sm mb-1 block">Trạng thái</label><select value={songForm.status} onChange={(e) => setSongForm({...songForm, status: e.target.value})} className="w-full bg-[#151a30] text-white px-4 py-2 rounded-lg border border-gray-600"><option>Public</option><option>Private</option></select></div>
                            </div>
                            <div><label className="text-gray-400 text-sm mb-1 block">Thuộc Album</label><select value={songForm.albumId || ""} onChange={(e) => setSongForm({...songForm, albumId: e.target.value})} className="w-full bg-[#151a30] text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-[#3BC8E7]"><option value="">-- Single --</option>{albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}</select></div>
                        </>
                    )}

                    {editType === "album" && (
                         <>
                            <div className="flex gap-4">
                                <div onClick={() => albumFileInputRef.current?.click()} className="w-24 h-24 bg-[#151a30] rounded-lg border border-gray-600 flex-shrink-0 overflow-hidden cursor-pointer relative group">
                                    {albumForm.coverPreview ? <img src={albumForm.coverPreview} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-500"><ImageIcon size={24} /></div>}
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><Edit size={20} className="text-white"/></div>
                                    <input type="file" ref={albumFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'album')}/>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <input type="text" value={albumForm.title} onChange={(e) => setAlbumForm({...albumForm, title: e.target.value})} className="w-full bg-[#151a30] text-white px-3 py-2 rounded-lg border border-gray-600" placeholder="Tên Album"/>
                                    <input type="text" value={albumForm.year} onChange={(e) => setAlbumForm({...albumForm, year: e.target.value})} className="w-full bg-[#151a30] text-white px-3 py-2 rounded-lg border border-gray-600" placeholder="Năm phát hành"/>
                                </div>
                            </div>
                            <textarea value={albumForm.desc} onChange={(e) => setAlbumForm({...albumForm, desc: e.target.value})} className="w-full bg-[#151a30] text-white px-3 py-2 rounded-lg border border-gray-600" placeholder="Mô tả album..." rows={2}/>
                            <hr className="border-gray-700 my-2"/>
                            
                            {songs.filter(s => albumForm.selectedSongIds.some(id => String(id) === String(s.id))).length > 0 && (
                                <div className="mb-4 bg-[#151a30] border border-gray-700 rounded-lg p-3">
                                    <label className="text-gray-400 font-bold text-sm mb-2 block">Bài hát đã chọn trong Album này:</label>
                                    <div className="max-h-32 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                        {songs.filter(s => albumForm.selectedSongIds.some(id => String(id) === String(s.id))).map(song => (
                                            <div key={song.id} className="flex justify-between items-center bg-[#1E2542] p-2 rounded border border-gray-600">
                                                <span className="text-sm text-gray-200 truncate flex-1 mr-2">{song.title}</span>
                                                <button onClick={() => toggleSongInAlbum(song.id)} className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded transition" title="Gỡ khỏi Album"><Trash2 size={16}/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-gray-300 font-bold text-sm mb-2 block flex items-center gap-2"><Disc size={16} className="text-[#3BC8E7]"/> Thêm/Bớt bài hát:</label>
                                <div className="bg-[#151a30] border border-gray-700 rounded-lg max-h-48 overflow-y-auto p-2">
                                    {songs.length > 0 ? songs.map(song => {
                                        const isSelected = albumForm.selectedSongIds.some(id => String(id) === String(song.id));
                                        return (
                                            <div key={song.id} onClick={() => toggleSongInAlbum(song.id)} className={`flex items-center p-2 rounded cursor-pointer transition ${isSelected ? 'bg-[#3BC8E7]/20 border border-[#3BC8E7]/30' : 'hover:bg-gray-700'}`}>
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 ${isSelected ? 'bg-[#3BC8E7] border-[#3BC8E7]' : 'border-gray-500'}`}>{isSelected && <CheckCircle2 size={12} className="text-black"/>}</div>
                                                <div className="flex-1 truncate text-sm text-gray-300">{song.title}</div>
                                                {song.albumId && String(song.albumId) !== String(editingAlbum?.id) && <span className="text-xs text-yellow-500 ml-2">(Đang ở album khác)</span>}
                                            </div>
                                        )
                                    }) : <p className="text-gray-500 text-xs text-center p-2">Chưa có bài hát nào</p>}
                                </div>
                            </div>
                        </>
                    )}

                    {/* --- [HOÀN THIỆN] EDIT PLAYLIST --- */}
                    {editType === "playlist" && (
                        <>
                           <div className="flex gap-4">
                               <div onClick={() => playlistFileInputRef.current?.click()} className="w-24 h-24 bg-[#151a30] rounded-lg border border-gray-600 flex-shrink-0 overflow-hidden cursor-pointer relative group"><img src={playlistForm.coverPreview || "https://via.placeholder.com/100"} className="w-full h-full object-cover"/><div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><Edit size={20} className="text-white"/></div><input type="file" ref={playlistFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'playlist')}/></div>
                               <div className="flex-1 space-y-2">
                                   <input type="text" value={playlistForm.title} onChange={(e) => setPlaylistForm({...playlistForm, title: e.target.value})} className="w-full bg-[#151a30] text-white px-3 py-2 rounded-lg border border-gray-600" placeholder="Tên Playlist"/>
                                   <textarea value={playlistForm.desc} onChange={(e) => setPlaylistForm({...playlistForm, desc: e.target.value})} className="w-full bg-[#151a30] text-white px-3 py-2 rounded-lg border border-gray-600 text-sm" placeholder="Mô tả playlist" rows={2}/>
                               </div>
                           </div>
                           <hr className="border-gray-700 my-4"/>
                           {/* Sử dụng component chọn bài hát đã nâng cấp */}
                           {renderPlaylistSongSelector()}
                        </>
                    )}
                </div>
                <div className="p-4 border-t border-gray-700 bg-[#151a30] flex justify-end gap-3">
                    <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition">Hủy</button>
                    <button onClick={() => {
                        if (editType === "song") handleSaveSong();
                        else if (editType === "album") handleSaveAlbum();
                        else if (editType === "playlist") handleSavePlaylist();
                    }} className="px-4 py-2 rounded-lg bg-[#3BC8E7] text-black font-bold hover:bg-[#34b3ce] transition flex items-center gap-2" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <><Save size={18}/> Lưu thay đổi</>}</button>
                </div>
            </div>
        </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <div className="space-y-6 animate-in fade-in duration-500"><h2 className="text-3xl font-bold text-white mb-6">Tổng quan</h2><div className="grid grid-cols-1 md:grid-cols-4 gap-6">{stats.map((stat, i) => (<div key={i} className="bg-[#1E2542] p-6 rounded-2xl shadow-lg border border-gray-700"><div className="flex items-center justify-between mb-4"><div className={`p-3 rounded-full bg-opacity-20 ${stat.color.replace('text', 'bg')} ${stat.color}`}>{stat.icon}</div></div><h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3><p className="text-gray-400 text-sm">{stat.label}</p></div>))}</div></div>;
      case "songs": return <div className="animate-in fade-in duration-500"><div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-bold text-white">Thư viện nhạc ({songs.length})</h2><button onClick={() => { setSongForm({ title: "", artist: "", description: "", genre: "Pop", status: "Public", albumId: "", file: null, fileName: "", coverFile: null, coverPreview: "" }); setActiveTab("upload"); }} className="bg-[#3BC8E7] text-black px-4 py-2 rounded-full font-bold hover:bg-[#34b3ce] transition flex items-center gap-2"><Plus size={18} /> Đăng bài mới</button></div><div className="bg-[#1E2542] rounded-2xl overflow-hidden border border-gray-700"><table className="w-full text-left text-gray-300"><thead className="bg-[#151a30] text-gray-400 uppercase text-xs"><tr><th className="p-4">Tên bài hát</th><th className="p-4">Album</th><th className="p-4">Trạng thái</th><th className="p-4 text-center">Hành động</th></tr></thead><tbody>{songs.map((song) => { const album = albums.find(a => String(a.id) === String(song.albumId)); return (<tr key={song.id} className="border-b border-gray-700 hover:bg-[#252d4d] transition"><td className="p-4 font-medium text-white flex items-center gap-3"><div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">{song.coverImage || song.cover ? <img src={song.coverImage || song.cover} alt={song.title} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">♫</div>}</div><div><div>{song.title}</div><div className="text-xs text-gray-500">{song.artist || song.genre || "Pop"}</div></div></td><td className="p-4 text-sm text-gray-400">{album ? <span className="flex items-center gap-1 text-[#3BC8E7]"><Disc size={14}/> {album.title}</span> : <span className="text-gray-600 italic">Single</span>}</td><td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${song.status === 'Public' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{song.status}</span></td><td className="p-4 flex justify-center gap-3"><button onClick={() => openEditSong(song)} className="text-gray-400 hover:text-[#3BC8E7]"><Edit size={18} /></button><button onClick={() => handleDeleteItem('songs', song.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button></td></tr>); })}</tbody></table></div></div>;
      
      // --- TAB UPLOAD ---
      case "upload": return (
        <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
            <h2 className="text-3xl font-bold text-white mb-2 text-center">Đăng tải bài hát</h2>
            <div className="bg-[#1E2542] p-8 rounded-2xl border border-gray-700 shadow-xl mt-6">
                <div onClick={() => songFileInputRef.current?.click()} className={`border-2 border-dashed ${songForm.file ? 'border-[#3BC8E7] bg-[#3BC8E7]/10' : 'border-gray-600 hover:border-[#3BC8E7]'} rounded-xl p-10 flex flex-col items-center justify-center mb-6 cursor-pointer transition`}>
                    {songForm.file ? <><CheckCircle2 size={64} className="text-[#3BC8E7] mb-4" /><p className="text-[#3BC8E7] font-medium">{songForm.fileName}</p></> : <><UploadCloud size={64} className="text-gray-500 mb-4" /><p className="text-gray-300">Nhấn để chọn file nhạc (.mp3)</p></>}
                    <input type="file" ref={songFileInputRef} onChange={handleSongAudioChange} accept="audio/*" className="hidden" />
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-gray-400 text-sm mb-1 block">Tên bài hát</label>
                        <input type="text" value={songForm.title} onChange={(e) => setSongForm({...songForm, title: e.target.value})} className="w-full bg-[#151a30] text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-[#3BC8E7]" placeholder="Nhập tên bài hát..." />
                    </div>

                    <div>
                        <label className="text-gray-400 text-sm mb-1 block">Tên nghệ sĩ trình bày</label>
                        <input type="text" value={songForm.artist} onChange={(e) => setSongForm({...songForm, artist: e.target.value})} className="w-full bg-[#151a30] text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-[#3BC8E7]" placeholder={`Mặc định: ${artistName}`} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="text-gray-400 text-sm mb-1 block">Thể loại</label>
                            <select value={songForm.genre} onChange={(e) => setSongForm({...songForm, genre: e.target.value})} className="w-full bg-[#151a30] text-white px-4 py-3 rounded-lg border border-gray-700">
                                {Object.keys(GENRE_MAP).map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-gray-400 text-sm mb-1 block">Album (Tùy chọn)</label>
                            <select value={songForm.albumId || ""} onChange={(e) => setSongForm({...songForm, albumId: e.target.value})} className="w-full bg-[#151a30] text-white px-4 py-3 rounded-lg border border-gray-700">
                                <option value="">-- Single --</option>{albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-gray-400 text-sm mb-1 block">Mô tả bài hát</label>
                        <textarea rows={3} value={songForm.description} onChange={(e) => setSongForm({...songForm, description: e.target.value})} className="w-full bg-[#151a30] text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-[#3BC8E7]" placeholder="Viết mô tả về bài hát này, lời tựa, cảm hứng sáng tác..." />
                    </div>

                    <div className="flex items-center gap-4 bg-[#151a30] p-4 rounded-lg border border-gray-700">
                        <div onClick={() => songCoverInputRef.current?.click()} className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-700 border border-gray-600 overflow-hidden">
                            {songForm.coverPreview ? <img src={songForm.coverPreview} className="w-full h-full object-cover" alt="Preview"/> : <ImageIcon size={24} className="text-gray-500"/>}
                            <input type="file" ref={songCoverInputRef} onChange={(e) => handleFileChange(e, 'songCover')} accept="image/*" className="hidden" />
                        </div>
                        <div className="flex-1"><p className="text-sm font-bold text-gray-300">Ảnh bìa bài hát</p><p className="text-xs text-gray-500">Sẽ được upload lên Cloudinary.</p></div>
                    </div>

                    <div className="flex gap-4 mt-6">
                        <button onClick={() => setActiveTab('songs')} className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-bold">Hủy</button>
                        <button onClick={handleSaveSong} disabled={isSubmitting} className="flex-1 py-3 rounded-xl bg-[#3BC8E7] text-black font-bold flex justify-center items-center gap-2">
                            {isSubmitting ? <><Loader2 className="animate-spin"/> Đang xử lý...</> : "Đăng tải ngay"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      );

      // --- TAB ALBUMS ---
      case "albums": return (
        <div className="animate-in fade-in duration-500">
            {!isCreatingAlbum ? (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-white">Quản lý Album ({albums.length})</h2>
                        <button onClick={openCreateAlbum} className="bg-[#3BC8E7] text-black px-4 py-2 rounded-full font-bold hover:bg-[#34b3ce] transition flex items-center gap-2"><Plus size={18} /> Tạo Album mới</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div onClick={openCreateAlbum} className="bg-[#1E2542]/50 border-2 border-dashed border-gray-600 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#3BC8E7] hover:bg-[#1E2542] transition h-full min-h-[250px] group">
                            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-4 group-hover:bg-[#3BC8E7] transition"><Plus size={32} className="text-gray-400 group-hover:text-black" /></div>
                            <p className="text-gray-400 font-medium group-hover:text-white">Tạo Album Mới</p>
                        </div>
                        {albums.map((album) => {
                            const songCount = songs.filter(s => String(s.albumId) === String(album.id)).length;
                            const displayCover = album.cover || album.coverImage; 
                            return (
                                <div key={album.id} className="bg-[#1E2542] rounded-2xl overflow-hidden shadow-lg border border-gray-700 group hover:translate-y-[-5px] transition-all duration-300">
                                    <div className="relative aspect-square overflow-hidden bg-gray-800">
                                        {displayCover ? <img src={displayCover} alt={album.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" /> : <div className="w-full h-full flex items-center justify-center text-gray-600"><Disc size={48} /></div>}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button onClick={() => openEditAlbum(album)} className="p-2 bg-white rounded-full hover:scale-110 transition"><Edit size={20} className="text-black"/></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteItem('albums', album.id); }} className="p-2 bg-white rounded-full hover:scale-110 transition hover:bg-red-500 hover:text-white"><Trash2 size={20}/></button>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-white font-bold text-lg truncate" title={album.title}>{album.title}</h3>
                                        <div className="flex justify-between items-center mt-2 text-gray-400 text-sm">
                                            <span className="flex items-center gap-1"><Calendar size={14}/> {album.year}</span>
                                            <span className="bg-gray-700 px-2 py-0.5 rounded text-xs text-gray-300">{songCount} bài hát</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-2 text-center">Tạo Album Mới</h2>
                    <div className="bg-[#1E2542] p-8 rounded-2xl border border-gray-700 shadow-xl mt-6">
                        <div className="flex flex-col md:flex-row gap-6 mb-6">
                            <div className="w-full md:w-1/3">
                                <label className="block text-gray-400 text-sm mb-2">Ảnh bìa</label>
                                <div onClick={() => albumFileInputRef.current?.click()} className="aspect-square bg-[#151a30] rounded-xl border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-[#3BC8E7] transition overflow-hidden">
                                    {albumForm.coverPreview ? <img src={albumForm.coverPreview} className="w-full h-full object-cover" /> : <ImageIcon size={32} className="text-gray-500"/>}
                                    <input type="file" ref={albumFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'album')}/>
                                </div>
                            </div>
                            <div className="w-full md:w-2/3 space-y-4">
                                <div><label className="block text-gray-400 text-sm mb-2">Tên Album</label><input type="text" value={albumForm.title} onChange={(e) => setAlbumForm({...albumForm, title: e.target.value})} className="w-full bg-[#151a30] text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-[#3BC8E7]" placeholder="Tên album..." /></div>
                                <div><label className="block text-gray-400 text-sm mb-2">Năm phát hành</label><input type="text" value={albumForm.year} onChange={(e) => setAlbumForm({...albumForm, year: e.target.value})} className="w-full bg-[#151a30] text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-[#3BC8E7]" /></div>
                                <div><label className="block text-gray-400 text-sm mb-2">Mô tả</label><textarea rows={2} value={albumForm.desc} onChange={(e) => setAlbumForm({...albumForm, desc: e.target.value})} className="w-full bg-[#151a30] text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-[#3BC8E7]" /></div>
                            </div>
                        </div>
                        <div className="flex gap-4 pt-4 border-t border-gray-700">
                            <button onClick={() => setIsCreatingAlbum(false)} className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-bold">Hủy bỏ</button>
                            <button onClick={handleSaveAlbum} disabled={isSubmitting} className="flex-1 py-3 rounded-xl bg-[#3BC8E7] text-black font-bold flex justify-center items-center gap-2">{isSubmitting ? <Loader2 className="animate-spin" /> : "Tạo Album"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      );

      // --- TAB PLAYLISTS [HOÀN THIỆN] ---
      case "playlists": return (
        <div className="animate-in fade-in duration-500">
            {!isCreatingPlaylist ? (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-white">Playlist ({playlists.length})</h2>
                        <button onClick={openCreatePlaylist} className="bg-[#3BC8E7] text-black px-4 py-2 rounded-full font-bold hover:bg-[#34b3ce] transition flex items-center gap-2"><Plus size={18} /> Tạo Playlist</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div onClick={openCreatePlaylist} className="bg-[#1E2542]/50 border-2 border-dashed border-gray-600 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#3BC8E7] hover:bg-[#1E2542] transition h-full min-h-[250px] group">
                            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-4 group-hover:bg-[#3BC8E7] transition"><Plus size={32} className="text-gray-400 group-hover:text-black" /></div>
                            <p className="text-gray-400 font-medium group-hover:text-white">Tạo Playlist Mới</p>
                        </div>
                        {playlists.map((playlist) => {
                            const songCount = playlist.songs ? playlist.songs.length : 0;
                            return (
                                <div key={playlist.id} className="bg-[#1E2542] rounded-2xl overflow-hidden shadow-lg border border-gray-700 group hover:translate-y-[-5px] transition-all duration-300 cursor-pointer" onClick={() => openEditPlaylist(playlist)}>
                                    <div className="relative aspect-square overflow-hidden bg-gray-800">
                                        {playlist.cover ? <img src={playlist.cover} alt={playlist.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" /> : <div className="w-full h-full flex items-center justify-center text-gray-600"><ListMusic size={48} /></div>}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); openEditPlaylist(playlist); }} className="p-2 bg-white rounded-full hover:scale-110 transition"><Edit size={20} className="text-black"/></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteItem('playlists', playlist.id); }} className="p-2 bg-white rounded-full hover:scale-110 transition hover:bg-red-500 hover:text-white"><Trash2 size={20}/></button>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-white font-bold text-lg truncate" title={playlist.title}>{playlist.title}</h3>
                                        <div className="flex justify-between items-center mt-2 text-gray-400 text-sm">
                                            <span className="truncate max-w-[60%]">{playlist.desc || "Không có mô tả"}</span>
                                            <span className="bg-[#3BC8E7]/20 text-[#3BC8E7] px-2 py-0.5 rounded text-xs font-bold">{songCount} bài</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-2 text-center">Tạo Playlist Mới</h2>
                    <div className="bg-[#1E2542] p-8 rounded-2xl border border-gray-700 shadow-xl mt-6">
                        <div className="flex flex-col md:flex-row gap-6 mb-6">
                            <div className="w-full md:w-1/3">
                                <label className="block text-gray-400 text-sm mb-2">Ảnh bìa</label>
                                <div onClick={() => playlistFileInputRef.current?.click()} className="aspect-square bg-[#151a30] rounded-xl border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-[#3BC8E7] transition overflow-hidden">
                                    {playlistForm.coverPreview ? <img src={playlistForm.coverPreview} className="w-full h-full object-cover" /> : <ImageIcon size={32} className="text-gray-500"/>}
                                    <input type="file" ref={playlistFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'playlist')}/>
                                </div>
                            </div>
                            <div className="w-full md:w-2/3 space-y-4">
                                <div><label className="block text-gray-400 text-sm mb-2">Tên Playlist</label><input type="text" value={playlistForm.title} onChange={(e) => setPlaylistForm({...playlistForm, title: e.target.value})} className="w-full bg-[#151a30] text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-[#3BC8E7]" placeholder="Tên Playlist"/></div>
                                <div><label className="block text-gray-400 text-sm mb-2">Mô tả ngắn</label><textarea rows={3} value={playlistForm.desc} onChange={(e) => setPlaylistForm({...playlistForm, desc: e.target.value})} className="w-full bg-[#151a30] text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-[#3BC8E7]" placeholder="Mô tả về playlist này..." /></div>
                            </div>
                        </div>
                        <hr className="border-gray-700 my-6"/>
                        {/* [HOÀN THIỆN] Sử dụng component chọn bài hát đã nâng cấp */}
                        {renderPlaylistSongSelector()}
                        <div className="flex gap-4 pt-4 border-t border-gray-700 mt-6">
                            <button onClick={() => setIsCreatingPlaylist(false)} className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-bold">Hủy bỏ</button>
                            <button onClick={handleSavePlaylist} disabled={isSubmitting} className="flex-1 py-3 rounded-xl bg-[#3BC8E7] text-black font-bold flex justify-center items-center gap-2">{isSubmitting ? <Loader2 className="animate-spin" /> : "Tạo Playlist"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#151a30] flex font-sans text-gray-100">
      <aside className="w-64 bg-[#1B2039] flex flex-col border-r border-gray-800 hidden md:flex sticky top-0 h-screen">
        <div className="p-8 flex items-center gap-3"><div className="w-8 h-8 bg-[#3BC8E7] rounded-full flex items-center justify-center font-bold text-black">A</div><h1 className="text-xl font-bold text-white tracking-wider">ARTIST<span className="text-[#3BC8E7]">HUB</span></h1></div>
        <nav className="flex-1 px-4 space-y-2">
            <SidebarItem icon={<LayoutDashboard size={20} />} label="Tổng quan" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
            <SidebarItem icon={<Music size={20} />} label="Bài hát" active={activeTab === "songs"} onClick={() => setActiveTab("songs")} />
            <SidebarItem icon={<Disc size={20} />} label="Albums" active={activeTab === "albums"} onClick={() => {setActiveTab("albums"); setIsCreatingAlbum(false)}} />
            <SidebarItem icon={<ListMusic size={20} />} label="Playlists" active={activeTab === "playlists"} onClick={() => {setActiveTab("playlists"); setIsCreatingPlaylist(false)}} />
            <SidebarItem icon={<UploadCloud size={20} />} label="Đăng tải nhạc" active={activeTab === "upload"} onClick={() => setActiveTab("upload")} />
            <SidebarItem icon={<Settings size={20} />} label="Cài đặt" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
        </nav>
        <div className="p-4 border-t border-gray-800"><div className="flex items-center gap-3 mb-4"><img src={avatar} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-[#3BC8E7]" /><div className="overflow-hidden"><p className="text-sm font-bold text-white truncate">{artistName}</p><p className="text-xs text-[#3BC8E7]">Artist Account</p></div></div><button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white transition w-full px-2 py-2 rounded-lg hover:bg-white/5"><LogOut size={18} /><span>Đăng xuất</span></button></div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto relative"><div className="md:hidden flex justify-between items-center mb-8"><h1 className="text-xl font-bold">ARTIST HUB</h1><button className="p-2 bg-[#1B2039] rounded"><User/></button></div>{renderContent()}</main>
      {renderEditModal()}
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${active ? "bg-[#3BC8E7] text-black shadow-lg shadow-[#3BC8E7]/20" : "text-gray-400 hover:bg-[#252d4d] hover:text-white"}`}>{icon}<span>{label}</span></button>
);

export default ArtistDashboard;