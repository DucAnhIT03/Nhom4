import { useState, useEffect } from 'react';
import { 
  Users, Music, Disc, UserCircle, MessageSquare, CreditCard, 
  Tag, TrendingUp
} from 'lucide-react';
import {
  getUserStats,
  getSongStats,
  getAlbumStats,
  getArtistStats,
  getCommentStats,
  getSubscriptionStats,
  getGenreStats,
  type UserStats,
  type SongStats,
  type AlbumStats,
  type ArtistStats,
  type CommentStats,
  type SubscriptionStats,
  type GenreStats,
} from '@/services/dashboard.service';
import './DashboardPage.css';

type TabType = 'overview' | 'users' | 'songs' | 'albums' | 'artists' | 'comments' | 'subscriptions' | 'genres';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(false);
  
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [songStats, setSongStats] = useState<SongStats | null>(null);
  const [albumStats, setAlbumStats] = useState<AlbumStats | null>(null);
  const [artistStats, setArtistStats] = useState<ArtistStats | null>(null);
  const [commentStats, setCommentStats] = useState<CommentStats | null>(null);
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats | null>(null);
  const [genreStats, setGenreStats] = useState<GenreStats | null>(null);

  useEffect(() => {
    loadAllStats();
  }, []);

  const loadAllStats = async () => {
    setLoading(true);
    try {
      const [users, songs, albums, artists, comments, subscriptions, genres] = await Promise.all([
        getUserStats().catch(() => null),
        getSongStats().catch(() => null),
        getAlbumStats().catch(() => null),
        getArtistStats().catch(() => null),
        getCommentStats().catch(() => null),
        getSubscriptionStats().catch(() => null),
        getGenreStats().catch(() => null),
      ]);
      
      if (users) setUserStats(users);
      if (songs) setSongStats(songs);
      if (albums) setAlbumStats(albums);
      if (artists) setArtistStats(artists);
      if (comments) setCommentStats(comments);
      if (subscriptions) setSubscriptionStats(subscriptions);
      if (genres) setGenreStats(genres);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Tổng quan', icon: TrendingUp },
    { id: 'users' as TabType, label: 'Người dùng', icon: Users },
    { id: 'songs' as TabType, label: 'Bài hát', icon: Music },
    { id: 'albums' as TabType, label: 'Album', icon: Disc },
    { id: 'artists' as TabType, label: 'Nghệ sĩ', icon: UserCircle },
    { id: 'comments' as TabType, label: 'Bình luận', icon: MessageSquare },
    { id: 'subscriptions' as TabType, label: 'Gói nâng cấp', icon: CreditCard },
    { id: 'genres' as TabType, label: 'Thể loại', icon: Tag },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
        <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Thống kê và phân tích hệ thống Music Online</p>
        </div>
        <button onClick={loadAllStats} className="refresh-btn" disabled={loading}>
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      <div className="dashboard-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="loading-state">
          <p>Đang tải dữ liệu...</p>
        </div>
      )}

      {!loading && (
        <>
          {activeTab === 'overview' && (
            <div className="dashboard-overview">
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">
                    <Users size={24} />
          </div>
          <div className="stat-content">
                    <h3 className="stat-value">{formatNumber(userStats?.totalUsers || 0)}</h3>
                    <p className="stat-label">Tổng người dùng</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-green">
                    <Music size={24} />
          </div>
          <div className="stat-content">
                    <h3 className="stat-value">{formatNumber(songStats?.totalSongs || 0)}</h3>
                    <p className="stat-label">Tổng bài hát</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-purple">
                    <Disc size={24} />
          </div>
          <div className="stat-content">
                    <h3 className="stat-value">{formatNumber(albumStats?.totalAlbums || 0)}</h3>
                    <p className="stat-label">Tổng album</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-orange">
                    <UserCircle size={24} />
                  </div>
                  <div className="stat-content">
                    <h3 className="stat-value">{formatNumber(artistStats?.totalArtists || 0)}</h3>
                    <p className="stat-label">Tổng nghệ sĩ</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon stat-icon-blue">
                    <MessageSquare size={24} />
                  </div>
                  <div className="stat-content">
                    <h3 className="stat-value">{formatNumber(commentStats?.totalComments || 0)}</h3>
                    <p className="stat-label">Tổng bình luận</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon stat-icon-green">
                    <CreditCard size={24} />
          </div>
          <div className="stat-content">
                    <h3 className="stat-value">{formatNumber(subscriptionStats?.totalRevenue || 0)}</h3>
                    <p className="stat-label">Doanh thu (VNĐ)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && userStats && (
            <div className="stats-content">
              <div className="stats-grid">
                <div className="content-card">
                  <h2 className="content-title">Thống kê người dùng</h2>
                  <div className="stats-list">
                    <div className="stat-item">
                      <span className="stat-item-label">Tổng số người dùng:</span>
                      <span className="stat-item-value">{formatNumber(userStats.totalUsers)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-item-label">Đang hoạt động:</span>
                      <span className="stat-item-value">{formatNumber(userStats.activeUsers)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-item-label">Đã chặn:</span>
                      <span className="stat-item-value">{formatNumber(userStats.blockedUsers)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-item-label">Chờ xác thực:</span>
                      <span className="stat-item-value">{formatNumber(userStats.verifyUsers)}</span>
                    </div>
                  </div>
                </div>

                <div className="content-card">
                  <h2 className="content-title">Theo loại tài khoản</h2>
                  <div className="stats-list">
                    <div className="stat-item">
                      <span className="stat-item-label">Free:</span>
                      <span className="stat-item-value">{formatNumber(userStats.freeUsers)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-item-label">Premium:</span>
                      <span className="stat-item-value">{formatNumber(userStats.premiumUsers)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-item-label">Artist:</span>
                      <span className="stat-item-value">{formatNumber(userStats.artistUsers)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'songs' && songStats && (
            <div className="stats-content">
              <div className="stats-grid">
                <div className="content-card">
                  <h2 className="content-title">Tổng quan bài hát</h2>
                  <div className="stats-list">
                    <div className="stat-item">
                      <span className="stat-item-label">Tổng số bài hát:</span>
                      <span className="stat-item-value">{formatNumber(songStats.totalSongs)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-item-label">Tổng lượt nghe:</span>
                      <span className="stat-item-value">{formatNumber(songStats.totalViews)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-item-label">Tổng lượt yêu thích:</span>
                      <span className="stat-item-value">{formatNumber(songStats.totalFavorites)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-item-label">Tổng bình luận:</span>
                      <span className="stat-item-value">{formatNumber(songStats.totalComments)}</span>
                    </div>
                  </div>
                </div>

                <div className="content-card">
                  <h2 className="content-title">Top bài hát theo lượt nghe</h2>
                  <div className="table-container">
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>Bài hát</th>
                          <th>Nghệ sĩ</th>
                          <th className="text-right">Lượt nghe</th>
                        </tr>
                      </thead>
                      <tbody>
                        {songStats.topSongsByViews.slice(0, 10).map((song) => (
                          <tr key={song.id}>
                            <td>{song.title}</td>
                            <td>{song.artistName}</td>
                            <td className="text-right">{formatNumber(song.views)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="content-card">
                  <h2 className="content-title">Top bài hát yêu thích</h2>
                  <div className="table-container">
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>Bài hát</th>
                          <th>Nghệ sĩ</th>
                          <th className="text-right">Lượt yêu thích</th>
                        </tr>
                      </thead>
                      <tbody>
                        {songStats.topSongsByFavorites.slice(0, 10).map((song) => (
                          <tr key={song.id}>
                            <td>{song.title}</td>
                            <td>{song.artistName}</td>
                            <td className="text-right">{formatNumber(song.favoriteCount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'albums' && albumStats && (
            <div className="stats-content">
              <div className="stats-grid">
                <div className="content-card">
                  <h2 className="content-title">Tổng quan album</h2>
                  <div className="stats-list">
                    <div className="stat-item">
                      <span className="stat-item-label">Tổng số album:</span>
                      <span className="stat-item-value">{formatNumber(albumStats.totalAlbums)}</span>
                    </div>
                  </div>
                </div>

                <div className="content-card">
                  <h2 className="content-title">Top album theo số bài hát</h2>
                  <div className="table-container">
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>Album</th>
                          <th>Nghệ sĩ</th>
                          <th className="text-right">Số bài hát</th>
                        </tr>
                      </thead>
                      <tbody>
                        {albumStats.topAlbumsBySongs.slice(0, 10).map((album) => (
                          <tr key={album.id}>
                            <td>{album.title}</td>
                            <td>{album.artistName || 'N/A'}</td>
                            <td className="text-right">{formatNumber(album.songCount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'artists' && artistStats && (
            <div className="stats-content">
              <div className="stats-grid">
                <div className="content-card">
                  <h2 className="content-title">Tổng quan nghệ sĩ</h2>
                  <div className="stats-list">
                    <div className="stat-item">
                      <span className="stat-item-label">Tổng số nghệ sĩ:</span>
                      <span className="stat-item-value">{formatNumber(artistStats.totalArtists)}</span>
                    </div>
                  </div>
                </div>

                <div className="content-card">
                  <h2 className="content-title">Top nghệ sĩ theo số album</h2>
                  <div className="table-container">
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>Nghệ sĩ</th>
                          <th className="text-right">Số album</th>
                        </tr>
                      </thead>
                      <tbody>
                        {artistStats.topArtistsByAlbums.slice(0, 10).map((artist) => (
                          <tr key={artist.id}>
                            <td>{artist.artistName}</td>
                            <td className="text-right">{formatNumber(artist.albumCount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comments' && commentStats && (
            <div className="stats-content">
              <div className="stats-grid">
                <div className="content-card">
                  <h2 className="content-title">Tổng quan bình luận</h2>
                  <div className="stats-list">
                    <div className="stat-item">
                      <span className="stat-item-label">Tổng số bình luận:</span>
                      <span className="stat-item-value">{formatNumber(commentStats.totalComments)}</span>
                    </div>
                  </div>
                </div>

                <div className="content-card">
                  <h2 className="content-title">Bài hát có nhiều bình luận nhất</h2>
                  <div className="table-container">
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>Bài hát</th>
                          <th>Nghệ sĩ</th>
                          <th className="text-right">Số bình luận</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commentStats.topCommentedSongs.slice(0, 10).map((song) => (
                          <tr key={song.songId}>
                            <td>{song.songTitle}</td>
                            <td>{song.artistName}</td>
                            <td className="text-right">{formatNumber(song.commentCount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscriptions' && subscriptionStats && (
            <div className="stats-content">
              <div className="stats-grid">
                <div className="content-card">
                  <h2 className="content-title">Tổng quan gói nâng cấp</h2>
                  <div className="stats-list">
                    <div className="stat-item">
                      <span className="stat-item-label">Tổng số đăng ký:</span>
                      <span className="stat-item-value">{formatNumber(subscriptionStats.totalSubscriptions)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-item-label">Tổng doanh thu:</span>
                      <span className="stat-item-value">{formatNumber(subscriptionStats.totalRevenue)} VNĐ</span>
                    </div>
                  </div>
                </div>

                <div className="content-card">
                  <h2 className="content-title">Doanh thu theo gói</h2>
                  <div className="table-container">
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>Gói</th>
                          <th className="text-right">Số lượng</th>
                          <th className="text-right">Doanh thu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscriptionStats.revenueByPlan.map((revenue, idx) => (
                          <tr key={idx}>
                            <td>{revenue.plan}</td>
                            <td className="text-right">{formatNumber(revenue.count)}</td>
                            <td className="text-right">{formatNumber(revenue.revenue)} VNĐ</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'genres' && genreStats && (
            <div className="stats-content">
              <div className="stats-grid">
                <div className="content-card">
                  <h2 className="content-title">Tổng quan thể loại</h2>
                  <div className="stats-list">
                    <div className="stat-item">
                      <span className="stat-item-label">Tổng số thể loại:</span>
                      <span className="stat-item-value">{formatNumber(genreStats.totalGenres)}</span>
                    </div>
                  </div>
                </div>

                <div className="content-card">
                  <h2 className="content-title">Thể loại theo số bài hát</h2>
                  <div className="table-container">
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>Thể loại</th>
                          <th className="text-right">Số bài hát</th>
                        </tr>
                      </thead>
                      <tbody>
                        {genreStats.genresBySongCount.slice(0, 10).map((genre) => (
                          <tr key={genre.genreId}>
                            <td>{genre.genreName}</td>
                            <td className="text-right">{formatNumber(genre.songCount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardPage;
