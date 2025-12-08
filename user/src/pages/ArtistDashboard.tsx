import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Music, UploadCloud, LogOut, User,
  PlayCircle, Disc, Search, Trash2, Edit, Plus,
  Image as ImageIcon, Calendar, CheckCircle2, X, Save, ListMusic,
  Loader2, FolderOpen, Home, Play,
  MessageSquare, Gem
} from "lucide-react";
import MyAlbumsTab from "../components/ArtistMyContent/MyAlbumsTab";
import CommentManagementTab from "../components/ArtistMyContent/CommentManagementTab";
import MusicPlayerBar from "../components/HomePage/MusicPlayerBar";
import { useMusic } from "../contexts/MusicContext";
import { 
  getMyAlbums, 
  createMyAlbum, 
  updateMyAlbum, 
  deleteMyAlbum,
  getMySongs,
  createMySong,
  updateMySong,
  deleteMySong,
  type MyAlbum 
} from "../services/artist-my-content.service";
import { getGenres, type Genre } from "../services/genre.service";

// --- CẤU HÌNH API & CLOUDINARY ---
const API_BASE_URL = "http://localhost:3000"; 
const USE_MOCK_API = false; 

// [QUAN TRỌNG] HÃY THAY ĐỔI THÔNG TIN CỦA BẠN Ở ĐÂY
const CLOUDINARY_CLOUD_NAME = "dy9odkj0j"; // Cloud Name của bạn
const CLOUDINARY_UPLOAD_PRESET = "music-app-upload"; // Upload Preset của bạn

// --- MAPPING GENRE --- (Deprecated - sẽ dùng genres từ API)
// const GENRE_MAP: Record<string, number> = {
//     "Pop": 1,
//     "Ballad": 2,
//     "Rap/Hip-hop": 3,
//     "Indie": 4,
//     "R&B": 5
// };

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
  artistId?: number | null;
  genre?: string;       
  coverImage?: string;  
  cover?: string;       
  audioUrl?: string; 
  fileUrl?: string;
  type?: 'FREE' | 'PREMIUM';
  artist?: string; 
  description?: string; 
}

interface Album {
  id: number | string;
  title: string;
  year?: string;
  releaseDate?: string;
  desc?: string;
  description?: string;
  cover: string;
  coverImage?: string;
  type?: 'FREE' | 'PREMIUM';
  backgroundMusic?: string;
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
  // Đọc tab từ URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get("tab") as "dashboard" | "songs" | "albums" | "playlists" | "upload" | "settings" | "my-content" | "comments" | null;
  const [activeTab, setActiveTab] = useState<"dashboard" | "songs" | "albums" | "playlists" | "upload" | "settings" | "my-content" | "comments">(tabFromUrl || "dashboard");
  const [artistName, setArtistName] = useState("Artist");
  const [avatar, setAvatar] = useState("https://cdn-icons-png.flaticon.com/512/3974/3974038.png");
  const [currentArtistId, setCurrentArtistId] = useState<number | null>(null);
  
  // Music player context
  const { setCurrentlyPlayingSong, setQueue } = useMusic();

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

  // State cho danh sách genres từ API
  const [genres, setGenres] = useState<Genre[]>([]);


  // Form States
  const [songForm, setSongForm] = useState({
    title: "", 
    artist: "",     
    description: "", 
    genre: "Pop", 
    status: "Public", 
    albumId: "" as string | number,
    duration: "",
    type: "FREE" as "FREE" | "PREMIUM",
    file: null as File | null, 
    fileName: "", 
    coverFile: null as File | null, 
    coverPreview: ""
  });

  const [albumForm, setAlbumForm] = useState({
    title: "", releaseDate: "", desc: "", type: "FREE" as "FREE" | "PREMIUM", 
    coverFile: null as File | null, coverPreview: "",
    backgroundMusicFile: null as File | null, backgroundMusicUrl: "",
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
  const albumBackgroundMusicInputRef = useRef<HTMLInputElement>(null);
  const playlistFileInputRef = useRef<HTMLInputElement>(null);
  const songFileInputRef = useRef<HTMLInputElement>(null);
  const songCoverInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
        // Lấy danh sách genres từ API
        const genresData = await getGenres();
        setGenres(genresData);
        
        // Nếu có genres và songForm.genre chưa hợp lệ, set genre đầu tiên
        if (genresData.length > 0 && !genresData.find(g => g.genreName === songForm.genre)) {
            setSongForm(prev => ({ ...prev, genre: genresData[0].genreName }));
        }

        // Lấy albums từ API của nghệ sĩ
        const albumsResponse = await getMyAlbums(1, 100);
        const albumsData = albumsResponse.data.map((album: MyAlbum) => ({
          id: album.id,
          title: album.title,
          releaseDate: album.releaseDate,
          year: album.releaseDate ? new Date(album.releaseDate).getFullYear().toString() : '',
          desc: '',
          description: '',
          cover: album.coverImage || '',
          coverImage: album.coverImage || '',
          type: album.type,
        }));
        
        // Lấy songs từ API của nghệ sĩ
        const songsResponse = await getMySongs(1, 100);
        const songsData = songsResponse.data.map((song: any) => ({
          id: song.id,
          title: song.title,
          artist: song.artist?.artistName || artistName,
          plays: song.views || 0,
          duration: song.duration || '0:00',
          status: 'Public',
          releaseDate: song.createdAt,
          albumId: song.albumId || null,
          genreId: song.genreId || null,
          artistId: song.artistId || song.artist?.id || null,
          genre: genresData.find(g => g.id === song.genreId)?.genreName || 'Unknown',
          coverImage: song.coverImage || '',
          cover: song.coverImage || '',
          audioUrl: song.fileUrl,
          fileUrl: song.fileUrl,
          type: song.type || 'FREE',
        }));
        
        // Lưu artistId từ bài hát đầu tiên (tất cả đều cùng artistId trong getMySongs)
        if (songsData.length > 0 && songsData[0].artistId) {
          const artistId = songsData[0].artistId;
          setCurrentArtistId(artistId);
          // Lưu vào localStorage để dùng ở các component khác
          localStorage.setItem('artistId', artistId.toString());
        }
        
        const data = await apiService.getDashboard();
        setStats([
          { label: "Tổng lượt nghe", value: songsData.reduce((sum: number, s: any) => sum + (s.plays || 0), 0), icon: <PlayCircle size={24} />, color: "text-blue-400" },
          { label: "Tổng bài hát", value: songsData.length, icon: <Music size={24} />, color: "text-purple-400" },
          { label: "Tổng Album", value: albumsData.length, icon: <Disc size={24} />, color: "text-green-400" },
          { label: "Playlist", value: data.playlists?.length || 0, icon: <ListMusic size={24} />, color: "text-pink-400" },
        ]);
        setSongs(songsData);
        setAlbums(albumsData);
        setPlaylists(data.playlists || []);
    } catch (err) {
        setError("Không thể kết nối đến máy chủ.");
    } finally {
        setIsLoading(false);
    }
  };

  // Cập nhật activeTab khi URL thay đổi (khi component mount hoặc URL thay đổi)
  useEffect(() => {
    const checkUrlTab = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tabFromUrl = urlParams.get("tab") as "dashboard" | "songs" | "albums" | "playlists" | "upload" | "settings" | "my-content" | "comments" | null;
      if (tabFromUrl && ["dashboard", "songs", "albums", "playlists", "upload", "settings", "my-content", "comments"].includes(tabFromUrl)) {
        setActiveTab(tabFromUrl);
      }
    };
    
    checkUrlTab();
    // Lắng nghe sự kiện popstate khi user navigate bằng browser back/forward
    window.addEventListener("popstate", checkUrlTab);
    return () => window.removeEventListener("popstate", checkUrlTab);
  }, []);

  useEffect(() => {
    // Lấy thông tin user từ API để đảm bảo role được cập nhật
    const loadUserInfo = async () => {
      try {
        const { getCurrentUser } = await import("../services/auth.service");
        const userProfile = await getCurrentUser();
        
        // Cập nhật role từ API (đảm bảo role mới nhất sau khi admin gán quyền)
        if (userProfile.role) {
          // Normalize role: loại bỏ "ROLE_" prefix và chuyển về lowercase
          const normalizedRole = userProfile.role.replace(/^ROLE_/i, "").toLowerCase();
          localStorage.setItem("role", normalizedRole);
        }
        if (userProfile.firstName && userProfile.lastName) {
          setArtistName(`${userProfile.firstName} ${userProfile.lastName}`);
          localStorage.setItem("userName", `${userProfile.firstName} ${userProfile.lastName}`);
        }
        if ((userProfile as any).profileImage) {
          setAvatar((userProfile as any).profileImage);
          localStorage.setItem("avatar", (userProfile as any).profileImage);
        } else {
          // Ensure avatar always has a value
          const fallbackAvatar = localStorage.getItem("avatar") || "https://cdn-icons-png.flaticon.com/512/3974/3974038.png";
          setAvatar(fallbackAvatar);
        }
      } catch (err: any) {
        console.error("Error loading user info:", err);
        // Check if it's a 401 error (unauthorized)
        if (err?.response?.status === 401) {
          // Token is invalid or missing, redirect to login
          localStorage.clear();
          window.location.href = "/";
          return;
        }
        // Fallback nếu không lấy được từ API
        setArtistName(localStorage.getItem("userName") || "Artist");
        setAvatar(localStorage.getItem("avatar") || "https://cdn-icons-png.flaticon.com/512/3974/3974038.png");
      }
    };
    
    loadUserInfo();
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

  const handleBackgroundMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        alert('Vui lòng chọn file audio (MP3, WAV, etc.)');
        return;
      }
      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 20MB');
        return;
      }
      setAlbumForm({ 
        ...albumForm, 
        backgroundMusicFile: file,
        backgroundMusicUrl: URL.createObjectURL(file)
      });
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

        let backgroundMusicUrl = albumForm.backgroundMusicUrl;
        if (albumForm.backgroundMusicFile) {
            // Upload nhạc nền lên Cloudinary
            const formData = new FormData();
            formData.append("file", albumForm.backgroundMusicFile);
            formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
            
            try {
                const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`, {
                    method: "POST",
                    body: formData,
                });
                if (res.ok) {
                    const data = await res.json();
                    backgroundMusicUrl = data.secure_url;
                } else {
                    throw new Error("Lỗi upload nhạc nền");
                }
            } catch (uploadErr) {
                console.error("Error uploading background music:", uploadErr);
                alert("Lỗi upload nhạc nền. Vui lòng thử lại.");
                setIsSubmitting(false);
                return;
            }
        }

        const payload: any = {
            title: albumForm.title,
            type: albumForm.type || "FREE",
        };
        
        // Chỉ thêm các field nếu có giá trị
        if (albumForm.releaseDate) {
            payload.releaseDate = albumForm.releaseDate;
        }
        if (coverUrl) {
            payload.coverImage = coverUrl;
        }
        if (backgroundMusicUrl) {
            payload.backgroundMusic = backgroundMusicUrl;
        }
        
        // Đảm bảo không có field thừa
        const cleanPayload: any = {
            title: payload.title,
            type: payload.type,
        };
        if (payload.releaseDate) cleanPayload.releaseDate = payload.releaseDate;
        if (payload.coverImage) cleanPayload.coverImage = payload.coverImage;
        if (payload.backgroundMusic) cleanPayload.backgroundMusic = payload.backgroundMusic;
        
        console.log('Album payload (cleaned):', cleanPayload);

        if (editingAlbum) {
            await updateMyAlbum(editingAlbum.id as number, cleanPayload);
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
            await createMyAlbum(cleanPayload);
            await fetchData();
            setIsCreatingAlbum(false);
            alert("Tạo Album thành công!");
        }
    } catch (err: any) {
        console.error(err);
        alert("Lỗi khi lưu Album: " + (err.response?.data?.message || err.message || err));
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
        // Upload cover image nếu có
        let finalCoverUrl = songForm.coverPreview;
        if (songForm.coverFile) {
            finalCoverUrl = await uploadToCloudinary(songForm.coverFile);
        }

        // Upload audio file lên backend (sử dụng upload service)
        let fileUrl = "";
        if (songForm.file) {
            try {
                const { uploadFile } = await import("../services/upload.service");
                const uploadResult = await uploadFile(songForm.file);
                fileUrl = uploadResult.url;
            } catch (uploadErr: any) {
                console.error("Error uploading audio:", uploadErr);
                alert("Lỗi upload file nhạc: " + (uploadErr.response?.data?.message || uploadErr.message || "Vui lòng thử lại"));
                setIsSubmitting(false);
                return;
            }
        } else if (editingSong && (editingSong as any).audioUrl) {
            // Nếu đang edit và không có file mới, dùng URL cũ
            fileUrl = (editingSong as any).audioUrl;
        } else if (editingSong && (editingSong as any).fileUrl) {
            // Fallback: thử fileUrl
            fileUrl = (editingSong as any).fileUrl;
        }

        // Tìm genreId từ genre name
        const selectedGenre = genres.find(g => g.genreName === songForm.genre);
        const selectedGenreId = selectedGenre?.id || (genres.length > 0 ? genres[0].id : 1);

        const payload: any = {
            title: songForm.title,
            fileUrl: fileUrl,
            genreId: selectedGenreId,
            type: songForm.type || 'FREE',
        };

        if (finalCoverUrl) {
            payload.coverImage = finalCoverUrl;
        }
        if (songForm.albumId) {
            payload.albumId = parseInt(String(songForm.albumId));
        }
        if (songForm.duration) {
            payload.duration = songForm.duration;
        }

        if (editingSong) {
            await updateMySong(editingSong.id as number, payload);
            await fetchData();
            setIsEditModalOpen(false);
            setEditingSong(null);
            alert("Cập nhật bài hát thành công!");
        } else {
            await createMySong(payload);
            await fetchData();
            setSongForm({ title: "", artist: "", description: "", genre: genres.length > 0 ? genres[0].genreName : "Pop", status: "Public", albumId: "", duration: "", type: "FREE", file: null, fileName: "", coverFile: null, coverPreview: "" });
            setActiveTab("songs");
            alert("Đăng tải bài hát thành công!");
        }
    } catch (err: any) {
        console.error(err);
        alert("Lỗi: " + (err.response?.data?.message || err.message || "Vui lòng thử lại"));
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- UI HELPERS ---
  const openCreateAlbum = () => {
    setAlbumForm({ 
      title: "", 
      releaseDate: new Date().toISOString().split('T')[0], 
      desc: "", 
      type: "FREE", 
      coverFile: null, 
      coverPreview: "",
      backgroundMusicFile: null,
      backgroundMusicUrl: "",
      selectedSongIds: [] 
    });
    setIsCreatingAlbum(true);
    setActiveTab("albums");
  };

  const openEditAlbum = (album: Album) => {
    const currentAlbumSongs = songs.filter(s => String(s.albumId) === String(album.id)).map(s => s.id);
    setEditingAlbum(album);
    // Format releaseDate từ string hoặc Date sang YYYY-MM-DD
    let releaseDateValue = "";
    if (album.releaseDate) {
      try {
        const date = new Date(album.releaseDate);
        if (!isNaN(date.getTime())) {
          releaseDateValue = date.toISOString().split('T')[0];
        }
      } catch (e) {
        // Nếu không parse được, giữ nguyên
        releaseDateValue = album.releaseDate;
      }
    } else if (album.year) {
      // Fallback: nếu có year cũ, tạo date từ năm
      releaseDateValue = `${album.year}-01-01`;
    }
    setAlbumForm({
        title: album.title,
        releaseDate: releaseDateValue,
        desc: album.desc || album.description || "",
        type: (album.type as "FREE" | "PREMIUM") || "FREE",
        coverFile: null,
        coverPreview: album.cover || album.coverImage || "",
        backgroundMusicFile: null,
        backgroundMusicUrl: (album as any).backgroundMusic || "",
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
    // Tìm genre name từ genreId
    const genreName = genres.find(g => g.id === song.genreId)?.genreName || (genres.length > 0 ? genres[0].genreName : "Pop");
    setSongForm({ 
        title: song.title,
        artist: song.artist || "",
        duration: song.duration || "", 
        description: song.description || "", 
        genre: genreName, 
        status: song.status, 
        albumId: song.albumId || "",
        type: song.type || "FREE",
        file: null,
        fileName: "",
        coverFile: null,
        coverPreview: song.coverImage || song.cover || ""
    });
    setEditType("song");
    setIsEditModalOpen(true);
  };

  const handlePlaySong = (song: Song) => {
    if (!song.audioUrl && !song.fileUrl) {
      alert("Bài hát này chưa có file audio");
      return;
    }

    // Kiểm tra nếu là bài premium
    if (song.type === 'PREMIUM') {
      // Kiểm tra xem user hiện tại có phải là nghệ sĩ sở hữu bài hát không
      const isOwner = currentArtistId !== null && song.artistId === currentArtistId;
      
      if (!isOwner) {
        // Nếu không phải chủ sở hữu, kiểm tra subscription
        const userSubscription = localStorage.getItem('userSubscription');
        const isPremium = userSubscription === 'PREMIUM' || userSubscription === 'premium';
        
        if (!isPremium) {
          alert("Bài hát này yêu cầu tài khoản Premium. Vui lòng nâng cấp tài khoản để nghe bài hát này.");
          return;
        }
      }
      // Nếu là chủ sở hữu, cho phép nghe dù không có premium subscription
    }

    const audioUrl = song.audioUrl || song.fileUrl || "";
    const coverImage = song.coverImage || song.cover || "";

    // Tạo song object cho MusicPlayerBar (theo interface của MusicContext)
    const songForPlayer = {
      title: song.title,
      artist: song.artist || "Unknown Artist",
      image: coverImage || "https://via.placeholder.com/300",
      audioUrl: audioUrl,
      id: typeof song.id === 'number' ? song.id : undefined,
      type: song.type,
      artistId: song.artistId ?? undefined,
    };

    // Set bài hát đang phát
    setCurrentlyPlayingSong(songForPlayer);

    // Set queue với tất cả bài hát có audioUrl để có thể next/previous
    const songsWithAudio = songs
      .filter(s => s.audioUrl || s.fileUrl)
      .map(s => ({
        title: s.title,
        artist: s.artist || "Unknown Artist",
        image: s.coverImage || s.cover || "https://via.placeholder.com/300",
        audioUrl: s.audioUrl || s.fileUrl || "",
        id: typeof s.id === 'number' ? s.id : undefined,
        type: s.type,
        artistId: s.artistId ?? undefined,
      }))
      .filter(s => s.audioUrl); // Chỉ lấy bài có audioUrl

    setQueue(songsWithAudio);
  };

  const handleDeleteItem = async (type: 'songs'|'albums'|'playlists', id: number | string) => {
    if (!confirm("Bạn có chắc muốn xóa?")) return;
    try { 
        if (type === 'albums') {
            await deleteMyAlbum(id as number);
            const songsInAlbum = songs.filter(s => String(s.albumId) === String(id));
            for (const s of songsInAlbum) { 
                try { 
                    await updateMySong(s.id as number, { albumId: undefined }); 
                } catch(e) {
                    console.warn('Error updating song:', e);
                }
            }
        } else if (type === 'songs') {
            await deleteMySong(id as number);
        } else {
            await apiService.deleteItem(type, id);
        }
        fetchData(); 
    } catch (err: any) { 
        alert("Lỗi xóa: " + (err.response?.data?.message || err.message || "Vui lòng thử lại")); 
    }
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
                                <div><label className="text-gray-400 text-sm mb-1 block">Thể loại</label><select value={songForm.genre} onChange={(e) => setSongForm({...songForm, genre: e.target.value})} className="w-full bg-[#151a30] text-white px-4 py-2 rounded-lg border border-gray-600">{genres.length > 0 ? genres.map(g => <option key={g.id} value={g.genreName}>{g.genreName}</option>) : <option value="">Đang tải...</option>}</select></div>
                                <div><label className="text-gray-400 text-sm mb-1 block">Trạng thái</label><select value={songForm.status} onChange={(e) => setSongForm({...songForm, status: e.target.value})} className="w-full bg-[#151a30] text-white px-4 py-2 rounded-lg border border-gray-600"><option>Public</option><option>Private</option></select></div>
                            </div>
                            <div><label className="text-gray-400 text-sm mb-1 block">Loại bài hát</label><select value={songForm.type} onChange={(e) => setSongForm({...songForm, type: e.target.value as "FREE" | "PREMIUM"})} className="w-full bg-[#151a30] text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-[#3BC8E7]"><option value="FREE">Miễn phí</option><option value="PREMIUM">Premium</option></select></div>
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
                                    <div>
                                        <label className="text-gray-400 text-sm mb-1 block">Tên Album</label>
                                        <input type="text" value={albumForm.title} onChange={(e) => setAlbumForm({...albumForm, title: e.target.value})} className="w-full bg-[#151a30] text-white px-3 py-2 rounded-lg border border-gray-600" placeholder="Tên Album"/>
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-sm mb-1 block">Ngày phát hành</label>
                                        <input type="date" value={albumForm.releaseDate} onChange={(e) => setAlbumForm({...albumForm, releaseDate: e.target.value})} className="w-full bg-[#151a30] text-white px-3 py-2 rounded-lg border border-gray-600"/>
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-sm mb-1 block">Loại <span className="text-red-400">*</span></label>
                                        <select value={albumForm.type} onChange={(e) => setAlbumForm({...albumForm, type: e.target.value as "FREE" | "PREMIUM"})} className="w-full bg-[#151a30] text-white px-3 py-2 rounded-lg border border-gray-600">
                                            <option value="FREE">Miễn phí</option>
                                            <option value="PREMIUM">Premium</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <textarea value={albumForm.desc} onChange={(e) => setAlbumForm({...albumForm, desc: e.target.value})} className="w-full bg-[#151a30] text-white px-3 py-2 rounded-lg border border-gray-600" placeholder="Mô tả album..." rows={2}/>
                            <div>
                                <label className="text-gray-400 text-sm mb-1 block">Nhạc nền (Tùy chọn)</label>
                                <div className="space-y-2">
                                    {albumForm.backgroundMusicUrl && (
                                        <div className="bg-[#151a30] p-2 rounded-lg border border-gray-600 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Music size={18} className="text-[#3BC8E7]" />
                                                <span className="text-white text-xs">
                                                    {albumForm.backgroundMusicFile?.name || 'Nhạc nền đã chọn'}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setAlbumForm({...albumForm, backgroundMusicFile: null, backgroundMusicUrl: ''})}
                                                className="text-red-400 hover:text-red-500"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={albumBackgroundMusicInputRef}
                                        accept="audio/*"
                                        onChange={handleBackgroundMusicChange}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => albumBackgroundMusicInputRef.current?.click()}
                                        className="w-full bg-[#151a30] text-white px-3 py-2 rounded-lg border border-gray-600 hover:border-[#3BC8E7] transition flex items-center justify-center gap-2 text-sm"
                                    >
                                        <UploadCloud size={16} />
                                        <span>{albumForm.backgroundMusicUrl ? 'Thay đổi nhạc nền' : 'Chọn nhạc nền'}</span>
                                    </button>
                                </div>
                            </div>
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
      case "songs": return <div className="animate-in fade-in duration-500 pb-24"><div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-bold text-white">Thư viện nhạc ({songs.length})</h2><button onClick={() => { setSongForm({ title: "", artist: "", description: "", genre: genres.length > 0 ? genres[0].genreName : "Pop", status: "Public", albumId: "", duration: "", type: "FREE", file: null, fileName: "", coverFile: null, coverPreview: "" }); setActiveTab("upload"); }} className="bg-[#3BC8E7] text-black px-4 py-2 rounded-full font-bold hover:bg-[#34b3ce] transition flex items-center gap-2"><Plus size={18} /> Đăng bài mới</button></div><div className="bg-[#1E2542] rounded-2xl overflow-hidden border border-gray-700"><table className="w-full text-left text-gray-300"><thead className="bg-[#151a30] text-gray-400 uppercase text-xs"><tr><th className="p-4">Tên bài hát</th><th className="p-4">Thể loại</th><th className="p-4">Album</th><th className="p-4">Trạng thái</th><th className="p-4 text-center">Hành động</th></tr></thead><tbody>{songs.map((song) => { const album = albums.find(a => String(a.id) === String(song.albumId)); const songGenre = genres.find(g => g.id === song.genreId); const hasAudio = song.audioUrl || song.fileUrl; const isPremium = song.type === 'PREMIUM'; return (<tr key={song.id} className="border-b border-gray-700 hover:bg-[#252d4d] transition"><td className="p-4 font-medium text-white flex items-center gap-3"><div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 relative">{song.coverImage || song.cover ? <img src={song.coverImage || song.cover} alt={song.title} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">♫</div>}{isPremium && <div className="absolute top-0 right-0 bg-gradient-to-br from-yellow-400 to-yellow-600 p-1 rounded-bl-lg"><Gem size={12} className="text-white" fill="currentColor" /></div>}</div><div className="flex items-center gap-3 flex-1"><div><div className="flex items-center gap-2">{song.title}{isPremium && <span className="text-xs text-yellow-400">Premium</span>}</div><div className="text-xs text-gray-500">{song.artist || "Nghệ sĩ"}</div></div>{hasAudio && <button onClick={(e) => { e.stopPropagation(); handlePlaySong(song); }} className="w-8 h-8 rounded-full bg-[#3BC8E7]/20 hover:bg-[#3BC8E7]/30 flex items-center justify-center text-[#3BC8E7] transition hover:scale-110" title="Phát nhạc"><Play size={16} fill="currentColor" /></button>}</div></td><td className="p-4 text-sm text-gray-400">{songGenre ? <span className="px-2 py-1 rounded bg-[#3BC8E7]/20 text-[#3BC8E7]">{songGenre.genreName}</span> : <span className="text-gray-600 italic">-</span>}</td><td className="p-4 text-sm text-gray-400">{album ? <span className="flex items-center gap-1 text-[#3BC8E7]"><Disc size={14}/> {album.title}</span> : <span className="text-gray-600 italic">Single</span>}</td><td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${song.status === 'Public' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{song.status}</span></td><td className="p-4 flex justify-center gap-3"><button onClick={() => openEditSong(song)} className="text-gray-400 hover:text-[#3BC8E7]"><Edit size={18} /></button><button onClick={() => handleDeleteItem('songs', song.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button></td></tr>); })}</tbody></table></div></div>;
      
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
                                {genres.length > 0 ? genres.map(g => <option key={g.id} value={g.genreName}>{g.genreName}</option>) : <option value="">Đang tải...</option>}
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
                        <label className="text-gray-400 text-sm mb-1 block">Loại bài hát <span className="text-yellow-400">*</span></label>
                        <select value={songForm.type} onChange={(e) => setSongForm({...songForm, type: e.target.value as "FREE" | "PREMIUM"})} className="w-full bg-[#151a30] text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-[#3BC8E7]">
                            <option value="FREE">Miễn phí</option>
                            <option value="PREMIUM">Premium (Yêu cầu nâng cấp tài khoản)</option>
                        </select>
                        {songForm.type === "PREMIUM" && (
                            <p className="text-xs text-yellow-400 mt-1">⚠️ Bài hát Premium chỉ có thể nghe khi người dùng đã nâng cấp tài khoản</p>
                        )}
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
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14}/> {
                                                    album.releaseDate 
                                                        ? (() => {
                                                            try {
                                                                const date = new Date(album.releaseDate);
                                                                if (!isNaN(date.getTime())) {
                                                                    return date.toLocaleDateString('vi-VN');
                                                                }
                                                            } catch {}
                                                            return album.releaseDate;
                                                        })()
                                                        : album.year || '-'
                                                }
                                            </span>
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
                                <div><label className="block text-gray-400 text-sm mb-2">Ngày phát hành</label><input type="date" value={albumForm.releaseDate} onChange={(e) => setAlbumForm({...albumForm, releaseDate: e.target.value})} className="w-full bg-[#151a30] text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-[#3BC8E7]" /></div>
                                <div><label className="block text-gray-400 text-sm mb-2">Loại <span className="text-red-400">*</span></label><select value={albumForm.type} onChange={(e) => setAlbumForm({...albumForm, type: e.target.value as "FREE" | "PREMIUM"})} className="w-full bg-[#151a30] text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-[#3BC8E7]"><option value="FREE">Miễn phí</option><option value="PREMIUM">Premium</option></select></div>
                                <div><label className="block text-gray-400 text-sm mb-2">Mô tả</label><textarea rows={2} value={albumForm.desc} onChange={(e) => setAlbumForm({...albumForm, desc: e.target.value})} className="w-full bg-[#151a30] text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-[#3BC8E7]" /></div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Nhạc nền (Tùy chọn)</label>
                                    <div className="space-y-2">
                                        {albumForm.backgroundMusicUrl && (
                                            <div className="bg-[#151a30] p-3 rounded-lg border border-gray-700 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Music size={20} className="text-[#3BC8E7]" />
                                                    <span className="text-white text-sm">
                                                        {albumForm.backgroundMusicFile?.name || 'Nhạc nền đã chọn'}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setAlbumForm({...albumForm, backgroundMusicFile: null, backgroundMusicUrl: ''})}
                                                    className="text-red-400 hover:text-red-500"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            ref={albumBackgroundMusicInputRef}
                                            accept="audio/*"
                                            onChange={handleBackgroundMusicChange}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => albumBackgroundMusicInputRef.current?.click()}
                                            className="w-full bg-[#151a30] text-white px-4 py-3 rounded-lg border border-gray-700 hover:border-[#3BC8E7] transition flex items-center justify-center gap-2"
                                        >
                                            <UploadCloud size={18} />
                                            <span>{albumForm.backgroundMusicUrl ? 'Thay đổi nhạc nền' : 'Chọn nhạc nền (MP3, WAV - tối đa 20MB)'}</span>
                                        </button>
                                    </div>
                                </div>
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

      case "my-content": return <MyAlbumsTab />;
      case "comments": return <CommentManagementTab />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#151a30] flex font-sans text-gray-100">
      <aside className="w-64 bg-[#1B2039] flex flex-col border-r border-gray-800 hidden md:flex sticky top-0 h-screen">
        <div className="p-8 flex items-center gap-3"><div className="w-8 h-8 bg-[#3BC8E7] rounded-full flex items-center justify-center font-bold text-black">A</div><h1 className="text-xl font-bold text-white tracking-wider">ARTIST<span className="text-[#3BC8E7]">HUB</span></h1></div>
        <nav className="flex-1 px-4 space-y-2">
            <SidebarItem icon={<Home size={20} />} label="Trang chủ" active={false} onClick={() => { window.location.href = "/"; }} />
            <SidebarItem icon={<LayoutDashboard size={20} />} label="Tổng quan" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
            <SidebarItem icon={<FolderOpen size={20} />} label="Đăng tải của tôi" active={activeTab === "my-content"} onClick={() => setActiveTab("my-content")} />
            <SidebarItem icon={<Music size={20} />} label="Bài hát" active={activeTab === "songs"} onClick={() => setActiveTab("songs")} />
            <SidebarItem icon={<Disc size={20} />} label="Albums" active={activeTab === "albums"} onClick={() => {setActiveTab("albums"); setIsCreatingAlbum(false)}} />
            <SidebarItem icon={<MessageSquare size={20} />} label="Bình luận" active={activeTab === "comments"} onClick={() => setActiveTab("comments")} />
        </nav>
        <div className="p-4 border-t border-gray-800"><div className="flex items-center gap-3 mb-4"><img src={avatar || "https://cdn-icons-png.flaticon.com/512/3974/3974038.png"} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-[#3BC8E7]" /><div className="overflow-hidden"><p className="text-sm font-bold text-white truncate">{artistName}</p><p className="text-xs text-[#3BC8E7]">Artist Account</p></div></div><button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white transition w-full px-2 py-2 rounded-lg hover:bg-white/5"><LogOut size={18} /><span>Đăng xuất</span></button></div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto relative"><div className="md:hidden flex justify-between items-center mb-8"><h1 className="text-xl font-bold">ARTIST HUB</h1><button className="p-2 bg-[#1B2039] rounded"><User/></button></div>{renderContent()}</main>
      {renderEditModal()}
      <MusicPlayerBar song={null} />
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${active ? "bg-[#3BC8E7] text-black shadow-lg shadow-[#3BC8E7]/20" : "text-gray-400 hover:bg-[#252d4d] hover:text-white"}`}>{icon}<span>{label}</span></button>
);

export default ArtistDashboard;