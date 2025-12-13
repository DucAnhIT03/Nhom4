import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, FindOptionsWhere, Repository } from "typeorm";
import { User, UserStatus } from "../../../shared/schemas/user.schema";
import {
  Subscription,
  SubscriptionPlanType,
  SubscriptionStatus,
} from "../../../shared/schemas/subscription.schema";
import { Song } from "../../../shared/schemas/song.schema";
import { Album, AlbumType } from "../../../shared/schemas/album.schema";
import { Artist } from "../../../shared/schemas/artist.schema";
import { Comment } from "../../../shared/schemas/comment.schema";
import { Genre } from "../../../shared/schemas/genre.schema";
import { Wishlist } from "../../../shared/schemas/wishlist.schema";
import { SongHistory } from "../../../shared/schemas/song-history.schema";
import { SubscriptionPlan } from "../../../shared/schemas/subscription-plan.schema";
import { AdminDashboardStatsDto } from "../dtos/response/admin-dashboard-stats.dto";
import { UserStatsDto } from "../dtos/response/user-stats.dto";
import { SongStatsDto, TopSong } from "../dtos/response/song-stats.dto";
import { AlbumStatsDto, TopAlbum } from "../dtos/response/album-stats.dto";
import { ArtistStatsDto, TopArtist } from "../dtos/response/artist-stats.dto";
import { CommentStatsDto, TopCommentedSong } from "../dtos/response/comment-stats.dto";
import { SubscriptionStatsDto, SubscriptionRevenue } from "../dtos/response/subscription-stats.dto";
import { GenreStatsDto, GenreStat } from "../dtos/response/genre-stats.dto";

export interface DashboardFilter {
  from?: Date;
  to?: Date;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
    @InjectRepository(Album)
    private readonly albumRepository: Repository<Album>,
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    @InjectRepository(SongHistory)
    private readonly songHistoryRepository: Repository<SongHistory>,
    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionPlanRepository: Repository<SubscriptionPlan>,
  ) {}

  async getAdminOverview(filter: DashboardFilter): Promise<AdminDashboardStatsDto> {
    const userWhere: FindOptionsWhere<User> = {};
    const subWhere: FindOptionsWhere<Subscription> = {};

    if (filter.from || filter.to) {
      const from = filter.from ?? new Date(0);
      const to = filter.to ?? new Date();
      userWhere.createdAt = Between(from, to);
      subWhere.createdAt = Between(from, to);
    }

    const [totalUsers, usersByStatusRaw, totalSubscriptions, subsByPlanRaw, subsByStatusRaw] =
      await Promise.all([
        this.userRepository.count({ where: userWhere }),
        this.userRepository
          .createQueryBuilder("u")
          .select("u.status", "status")
          .addSelect("COUNT(*)", "count")
          .where(userWhere)
          .groupBy("u.status")
          .getRawMany<{ status: UserStatus; count: string }>(),
        this.subscriptionRepository.count({ where: subWhere }),
        this.subscriptionRepository
          .createQueryBuilder("s")
          .select("s.plan", "plan")
          .addSelect("COUNT(*)", "count")
          .where(subWhere)
          .groupBy("s.plan")
          .getRawMany<{ plan: SubscriptionPlanType; count: string }>(),
        this.subscriptionRepository
          .createQueryBuilder("s")
          .select("s.status", "status")
          .addSelect("COUNT(*)", "count")
          .where(subWhere)
          .groupBy("s.status")
          .getRawMany<{ status: SubscriptionStatus; count: string }>(),
      ]);

    const usersByStatus: Record<UserStatus, number> = {} as Record<UserStatus, number>;
    for (const status of Object.values(UserStatus) as UserStatus[]) {
      usersByStatus[status] = 0;
    }
    for (const row of usersByStatusRaw) {
      usersByStatus[row.status] = Number(row.count);
    }

    const subscriptionsByPlan: Record<SubscriptionPlanType, number> =
      {} as Record<SubscriptionPlanType, number>;
    for (const plan of Object.values(SubscriptionPlanType) as SubscriptionPlanType[]) {
      subscriptionsByPlan[plan] = 0;
    }
    for (const row of subsByPlanRaw) {
      subscriptionsByPlan[row.plan] = Number(row.count);
    }

    const subscriptionsByStatus: Record<SubscriptionStatus, number> =
      {} as Record<SubscriptionStatus, number>;
    for (const status of Object.values(SubscriptionStatus) as SubscriptionStatus[]) {
      subscriptionsByStatus[status] = 0;
    }
    for (const row of subsByStatusRaw) {
      subscriptionsByStatus[row.status] = Number(row.count);
    }

    const dto = new AdminDashboardStatsDto();
    dto.totalUsers = totalUsers;
    dto.usersByStatus = usersByStatus;
    dto.totalSubscriptions = totalSubscriptions;
    dto.subscriptionsByPlan = subscriptionsByPlan;
    dto.subscriptionsByStatus = subscriptionsByStatus;

    return dto;
  }

  async getUserStats(filter: DashboardFilter): Promise<UserStatsDto> {
    const userWhere: FindOptionsWhere<User> = {};
    if (filter.from || filter.to) {
      const from = filter.from ?? new Date(0);
      const to = filter.to ?? new Date();
      userWhere.createdAt = Between(from, to);
    }

    const [totalUsers, usersByStatusRaw, usersByPlanRaw] = await Promise.all([
      this.userRepository.count({ where: userWhere }),
      this.userRepository
        .createQueryBuilder("u")
        .select("u.status", "status")
        .addSelect("COUNT(*)", "count")
        .where(userWhere)
        .groupBy("u.status")
        .getRawMany<{ status: UserStatus; count: string }>(),
      this.subscriptionRepository
        .createQueryBuilder("s")
        .innerJoin("users", "u", "u.id = s.user_id")
        .select("s.plan", "plan")
        .addSelect("COUNT(DISTINCT s.user_id)", "count")
        .where("s.status = :activeStatus", { activeStatus: SubscriptionStatus.ACTIVE })
        .andWhere(userWhere.createdAt ? "u.created_at BETWEEN :from AND :to" : "1=1", 
          userWhere.createdAt ? { from: filter.from ?? new Date(0), to: filter.to ?? new Date() } : {})
        .groupBy("s.plan")
        .getRawMany<{ plan: SubscriptionPlanType; count: string }>(),
    ]);

    const usersByStatus: Record<UserStatus, number> = {} as Record<UserStatus, number>;
    for (const status of Object.values(UserStatus) as UserStatus[]) {
      usersByStatus[status] = 0;
    }
    for (const row of usersByStatusRaw) {
      usersByStatus[row.status] = Number(row.count);
    }

    const usersByPlan: Record<SubscriptionPlanType, number> = {} as Record<SubscriptionPlanType, number>;
    for (const plan of Object.values(SubscriptionPlanType) as SubscriptionPlanType[]) {
      usersByPlan[plan] = 0;
    }
    for (const row of usersByPlanRaw) {
      usersByPlan[row.plan] = Number(row.count);
    }

    const dto = new UserStatsDto();
    dto.totalUsers = totalUsers;
    dto.usersByStatus = usersByStatus;
    dto.usersByPlan = usersByPlan;
    dto.activeUsers = usersByStatus[UserStatus.ACTIVE] || 0;
    dto.blockedUsers = usersByStatus[UserStatus.BLOCKED] || 0;
    dto.verifyUsers = usersByStatus[UserStatus.VERIFY] || 0;
    dto.freeUsers = usersByPlan[SubscriptionPlanType.FREE] || 0;
    dto.premiumUsers = usersByPlan[SubscriptionPlanType.PREMIUM] || 0;
    dto.artistUsers = usersByPlan[SubscriptionPlanType.ARTIST] || 0;

    return dto;
  }

  async getSongStats(filter: DashboardFilter, limit: number = 10): Promise<SongStatsDto> {
    const songWhere: FindOptionsWhere<Song> = {};
    if (filter.from || filter.to) {
      const from = filter.from ?? new Date(0);
      const to = filter.to ?? new Date();
      songWhere.createdAt = Between(from, to);
    }

    const [totalSongs, songsByTypeRaw, topSongsByViewsRaw, topSongsByFavoritesRaw, topSongsByCommentsRaw] = 
      await Promise.all([
        this.songRepository.count({ where: songWhere }),
        this.songRepository
          .createQueryBuilder("s")
          .select("s.type", "type")
          .addSelect("COUNT(*)", "count")
          .where(songWhere)
          .groupBy("s.type")
          .getRawMany<{ type: string; count: string }>(),
        this.songRepository
          .createQueryBuilder("s")
          .leftJoin("artists", "a", "a.id = s.artist_id")
          .select("s.id", "id")
          .addSelect("s.title", "title")
          .addSelect("a.artist_name", "artistName")
          .addSelect("s.views", "views")
          .addSelect("s.created_at", "createdAt")
          .where(songWhere)
          .orderBy("s.views", "DESC")
          .limit(limit)
          .getRawMany(),
        this.songRepository
          .createQueryBuilder("s")
          .leftJoin("artists", "a", "a.id = s.artist_id")
          .leftJoin("wishlists", "w", "w.song_id = s.id")
          .select("s.id", "id")
          .addSelect("s.title", "title")
          .addSelect("a.artist_name", "artistName")
          .addSelect("COUNT(DISTINCT w.user_id)", "favoriteCount")
          .addSelect("s.created_at", "createdAt")
          .where(songWhere)
          .groupBy("s.id")
          .orderBy("favoriteCount", "DESC")
          .limit(limit)
          .getRawMany(),
        this.songRepository
          .createQueryBuilder("s")
          .leftJoin("artists", "a", "a.id = s.artist_id")
          .leftJoin("comments", "c", "c.song_id = s.id")
          .select("s.id", "id")
          .addSelect("s.title", "title")
          .addSelect("a.artist_name", "artistName")
          .addSelect("COUNT(DISTINCT c.id)", "commentCount")
          .addSelect("s.created_at", "createdAt")
          .where(songWhere)
          .groupBy("s.id")
          .orderBy("commentCount", "DESC")
          .limit(limit)
          .getRawMany(),
      ]);

    const totalViews = await this.songRepository
      .createQueryBuilder("s")
      .select("SUM(s.views)", "total")
      .where(songWhere)
      .getRawOne<{ total: string }>();

    const totalFavorites = await this.wishlistRepository.count();
    const totalComments = await this.commentRepository.count();

    const songsByType = { FREE: 0, PREMIUM: 0 };
    for (const row of songsByTypeRaw) {
      if (row.type === "FREE") songsByType.FREE = Number(row.count);
      if (row.type === "PREMIUM") songsByType.PREMIUM = Number(row.count);
    }

    const topSongsByViews: TopSong[] = topSongsByViewsRaw.map((row) => ({
      id: row.id,
      title: row.title,
      artistName: row.artistName || "Unknown",
      views: Number(row.views),
      favoriteCount: 0,
      commentCount: 0,
      createdAt: row.createdAt,
    }));

    const topSongsByFavorites: TopSong[] = topSongsByFavoritesRaw.map((row) => ({
      id: row.id,
      title: row.title,
      artistName: row.artistName || "Unknown",
      views: 0,
      favoriteCount: Number(row.favoriteCount),
      commentCount: 0,
      createdAt: row.createdAt,
    }));

    const topSongsByComments: TopSong[] = topSongsByCommentsRaw.map((row) => ({
      id: row.id,
      title: row.title,
      artistName: row.artistName || "Unknown",
      views: 0,
      favoriteCount: 0,
      commentCount: Number(row.commentCount),
      createdAt: row.createdAt,
    }));

    const dto = new SongStatsDto();
    dto.totalSongs = totalSongs;
    dto.totalViews = Number(totalViews?.total || 0);
    dto.totalFavorites = totalFavorites;
    dto.totalComments = totalComments;
    dto.topSongsByViews = topSongsByViews;
    dto.topSongsByFavorites = topSongsByFavorites;
    dto.topSongsByComments = topSongsByComments;
    dto.songsByType = songsByType;

    return dto;
  }

  async getAlbumStats(filter: DashboardFilter, limit: number = 10): Promise<AlbumStatsDto> {
    const albumWhere: FindOptionsWhere<Album> = {};
    if (filter.from || filter.to) {
      const from = filter.from ?? new Date(0);
      const to = filter.to ?? new Date();
      albumWhere.createdAt = Between(from, to);
    }

    const [totalAlbums, albumsByTypeRaw, topAlbumsBySongsRaw, topAlbumsByViewsRaw, albumsByArtistRaw, albumsByMonthRaw] = 
      await Promise.all([
        this.albumRepository.count({ where: albumWhere }),
        this.albumRepository
          .createQueryBuilder("a")
          .select("a.type", "type")
          .addSelect("COUNT(*)", "count")
          .where(albumWhere)
          .groupBy("a.type")
          .getRawMany<{ type: AlbumType; count: string }>(),
        this.albumRepository
          .createQueryBuilder("a")
          .leftJoin("artists", "ar", "ar.id = a.artist_id")
          .leftJoin("songs", "s", "s.album_id = a.id")
          .select("a.id", "id")
          .addSelect("a.title", "title")
          .addSelect("ar.artist_name", "artistName")
          .addSelect("COUNT(DISTINCT s.id)", "songCount")
          .addSelect("a.type", "type")
          .addSelect("a.release_date", "releaseDate")
          .where(albumWhere)
          .groupBy("a.id")
          .orderBy("songCount", "DESC")
          .limit(limit)
          .getRawMany(),
        this.albumRepository
          .createQueryBuilder("a")
          .leftJoin("artists", "ar", "ar.id = a.artist_id")
          .leftJoin("songs", "s", "s.album_id = a.id")
          .select("a.id", "id")
          .addSelect("a.title", "title")
          .addSelect("ar.artist_name", "artistName")
          .addSelect("SUM(s.views)", "totalViews")
          .addSelect("a.type", "type")
          .addSelect("a.release_date", "releaseDate")
          .where(albumWhere)
          .groupBy("a.id")
          .orderBy("totalViews", "DESC")
          .limit(limit)
          .getRawMany(),
        this.albumRepository
          .createQueryBuilder("a")
          .leftJoin("artists", "ar", "ar.id = a.artist_id")
          .select("ar.id", "artistId")
          .addSelect("ar.artist_name", "artistName")
          .addSelect("COUNT(a.id)", "albumCount")
          .where(albumWhere)
          .groupBy("ar.id")
          .orderBy("albumCount", "DESC")
          .getRawMany(),
        this.albumRepository
          .createQueryBuilder("a")
          .select("DATE_FORMAT(a.created_at, '%Y-%m')", "month")
          .addSelect("COUNT(*)", "count")
          .where(albumWhere)
          .groupBy("month")
          .orderBy("month", "ASC")
          .getRawMany<{ month: string; count: string }>(),
      ]);

    const albumsByType: Record<AlbumType, number> = {} as Record<AlbumType, number>;
    for (const type of Object.values(AlbumType) as AlbumType[]) {
      albumsByType[type] = 0;
    }
    for (const row of albumsByTypeRaw) {
      albumsByType[row.type] = Number(row.count);
    }

    const topAlbumsBySongs: TopAlbum[] = topAlbumsBySongsRaw.map((row) => ({
      id: row.id,
      title: row.title,
      artistName: row.artistName,
      songCount: Number(row.songCount),
      totalViews: 0,
      releaseDate: row.releaseDate,
      type: row.type,
    }));

    const topAlbumsByViews: TopAlbum[] = topAlbumsByViewsRaw.map((row) => ({
      id: row.id,
      title: row.title,
      artistName: row.artistName,
      songCount: 0,
      totalViews: Number(row.totalViews || 0),
      releaseDate: row.releaseDate,
      type: row.type,
    }));

    const albumsByArtist = albumsByArtistRaw.map((row) => ({
      artistId: row.artistId,
      artistName: row.artistName || "Unknown",
      albumCount: Number(row.albumCount),
    }));

    const albumsByMonth = albumsByMonthRaw.map((row) => ({
      month: row.month,
      count: Number(row.count),
    }));

    const dto = new AlbumStatsDto();
    dto.totalAlbums = totalAlbums;
    dto.albumsByType = albumsByType;
    dto.topAlbumsBySongs = topAlbumsBySongs;
    dto.topAlbumsByViews = topAlbumsByViews;
    dto.albumsByArtist = albumsByArtist;
    dto.albumsByMonth = albumsByMonth;

    return dto;
  }

  async getArtistStats(filter: DashboardFilter, limit: number = 10): Promise<ArtistStatsDto> {
    const artistWhere: FindOptionsWhere<Artist> = {};
    if (filter.from || filter.to) {
      const from = filter.from ?? new Date(0);
      const to = filter.to ?? new Date();
      artistWhere.createdAt = Between(from, to);
    }

    const [totalArtists, topArtistsByAlbumsRaw, topArtistsBySongsRaw, topArtistsByViewsRaw] = 
      await Promise.all([
        this.artistRepository.count({ where: artistWhere }),
        this.artistRepository
          .createQueryBuilder("ar")
          .leftJoin("albums", "a", "a.artist_id = ar.id")
          .select("ar.id", "id")
          .addSelect("ar.artist_name", "artistName")
          .addSelect("COUNT(DISTINCT a.id)", "albumCount")
          .where(artistWhere)
          .groupBy("ar.id")
          .orderBy("albumCount", "DESC")
          .limit(limit)
          .getRawMany(),
        this.artistRepository
          .createQueryBuilder("ar")
          .leftJoin("songs", "s", "s.artist_id = ar.id")
          .select("ar.id", "id")
          .addSelect("ar.artist_name", "artistName")
          .addSelect("COUNT(DISTINCT s.id)", "songCount")
          .where(artistWhere)
          .groupBy("ar.id")
          .orderBy("songCount", "DESC")
          .limit(limit)
          .getRawMany(),
        this.artistRepository
          .createQueryBuilder("ar")
          .leftJoin("songs", "s", "s.artist_id = ar.id")
          .select("ar.id", "id")
          .addSelect("ar.artist_name", "artistName")
          .addSelect("SUM(s.views)", "totalViews")
          .where(artistWhere)
          .groupBy("ar.id")
          .orderBy("totalViews", "DESC")
          .limit(limit)
          .getRawMany(),
      ]);

    const topArtistsByAlbums: TopArtist[] = topArtistsByAlbumsRaw.map((row) => ({
      id: row.id,
      artistName: row.artistName,
      albumCount: Number(row.albumCount),
      songCount: 0,
      totalViews: 0,
    }));

    const topArtistsBySongs: TopArtist[] = topArtistsBySongsRaw.map((row) => ({
      id: row.id,
      artistName: row.artistName,
      albumCount: 0,
      songCount: Number(row.songCount),
      totalViews: 0,
    }));

    const topArtistsByViews: TopArtist[] = topArtistsByViewsRaw.map((row) => ({
      id: row.id,
      artistName: row.artistName,
      albumCount: 0,
      songCount: 0,
      totalViews: Number(row.totalViews || 0),
    }));

    const dto = new ArtistStatsDto();
    dto.totalArtists = totalArtists;
    dto.topArtistsByAlbums = topArtistsByAlbums;
    dto.topArtistsBySongs = topArtistsBySongs;
    dto.topArtistsByViews = topArtistsByViews;

    return dto;
  }

  async getCommentStats(filter: DashboardFilter, limit: number = 10): Promise<CommentStatsDto> {
    const commentWhere: FindOptionsWhere<Comment> = {};
    if (filter.from || filter.to) {
      const from = filter.from ?? new Date(0);
      const to = filter.to ?? new Date();
      commentWhere.createdAt = Between(from, to);
    }

    const [totalComments, topCommentedSongsRaw, commentsByMonthRaw, recentCommentsRaw] = 
      await Promise.all([
        this.commentRepository.count({ where: commentWhere }),
        this.commentRepository
          .createQueryBuilder("c")
          .leftJoin("songs", "s", "s.id = c.song_id")
          .leftJoin("artists", "a", "a.id = s.artist_id")
          .select("s.id", "songId")
          .addSelect("s.title", "songTitle")
          .addSelect("a.artist_name", "artistName")
          .addSelect("COUNT(c.id)", "commentCount")
          .where(commentWhere)
          .groupBy("s.id")
          .orderBy("commentCount", "DESC")
          .limit(limit)
          .getRawMany(),
        this.commentRepository
          .createQueryBuilder("c")
          .select("DATE_FORMAT(c.created_at, '%Y-%m')", "month")
          .addSelect("COUNT(*)", "count")
          .where(commentWhere)
          .groupBy("month")
          .orderBy("month", "ASC")
          .getRawMany<{ month: string; count: string }>(),
        this.commentRepository
          .createQueryBuilder("c")
          .leftJoin("users", "u", "u.id = c.user_id")
          .leftJoin("songs", "s", "s.id = c.song_id")
          .select("c.id", "id")
          .addSelect("c.content", "content")
          .addSelect("CONCAT(u.first_name, ' ', u.last_name)", "userName")
          .addSelect("s.title", "songTitle")
          .addSelect("c.created_at", "createdAt")
          .where(commentWhere)
          .orderBy("c.created_at", "DESC")
          .limit(limit)
          .getRawMany(),
      ]);

    const topCommentedSongs: TopCommentedSong[] = topCommentedSongsRaw.map((row) => ({
      songId: row.songId,
      songTitle: row.songTitle,
      artistName: row.artistName || "Unknown",
      commentCount: Number(row.commentCount),
    }));

    const commentsByMonth = commentsByMonthRaw.map((row) => ({
      month: row.month,
      count: Number(row.count),
    }));

    const recentComments = recentCommentsRaw.map((row) => ({
      id: row.id,
      content: row.content,
      userName: row.userName || "Unknown",
      songTitle: row.songTitle || "Unknown",
      createdAt: row.createdAt,
    }));

    const dto = new CommentStatsDto();
    dto.totalComments = totalComments;
    dto.topCommentedSongs = topCommentedSongs;
    dto.commentsByMonth = commentsByMonth;
    dto.recentComments = recentComments;

    return dto;
  }

  async getSubscriptionStats(filter: DashboardFilter): Promise<SubscriptionStatsDto> {
    const subWhere: FindOptionsWhere<Subscription> = {};
    if (filter.from || filter.to) {
      const from = filter.from ?? new Date(0);
      const to = filter.to ?? new Date();
      subWhere.createdAt = Between(from, to);
    }

    const [totalSubscriptions, subsByPlanRaw, subsByStatusRaw, revenueByPlanRaw, subsByMonthRaw] = 
      await Promise.all([
        this.subscriptionRepository.count({ where: subWhere }),
        this.subscriptionRepository
          .createQueryBuilder("s")
          .select("s.plan", "plan")
          .addSelect("COUNT(*)", "count")
          .where(subWhere)
          .groupBy("s.plan")
          .getRawMany<{ plan: SubscriptionPlanType; count: string }>(),
        this.subscriptionRepository
          .createQueryBuilder("s")
          .select("s.status", "status")
          .addSelect("COUNT(*)", "count")
          .where(subWhere)
          .groupBy("s.status")
          .getRawMany<{ status: SubscriptionStatus; count: string }>(),
        this.subscriptionRepository
          .createQueryBuilder("s")
          .innerJoin("subscription_plan", "sp", "sp.plan_name = s.plan")
          .select("s.plan", "plan")
          .addSelect("SUM(sp.price)", "revenue")
          .addSelect("COUNT(s.id)", "count")
          .where(subWhere)
          .andWhere("s.status = :status", { status: SubscriptionStatus.ACTIVE })
          .groupBy("s.plan")
          .getRawMany<{ plan: SubscriptionPlanType; revenue: string; count: string }>(),
        this.subscriptionRepository
          .createQueryBuilder("s")
          .select("DATE_FORMAT(s.created_at, '%Y-%m')", "month")
          .addSelect("COUNT(CASE WHEN s.status = 'ACTIVE' THEN 1 END)", "subscriptions")
          .addSelect("COUNT(CASE WHEN s.status = 'CANCELLED' THEN 1 END)", "cancellations")
          .addSelect("SUM(CASE WHEN s.status = 'ACTIVE' THEN sp.price ELSE 0 END)", "revenue")
          .leftJoin("subscription_plan", "sp", "sp.plan_name = s.plan")
          .where(subWhere)
          .groupBy("month")
          .orderBy("month", "ASC")
          .getRawMany<{ month: string; subscriptions: string; cancellations: string; revenue: string }>(),
      ]);

    const subscriptionsByPlan: Record<SubscriptionPlanType, number> = {} as Record<SubscriptionPlanType, number>;
    for (const plan of Object.values(SubscriptionPlanType) as SubscriptionPlanType[]) {
      subscriptionsByPlan[plan] = 0;
    }
    for (const row of subsByPlanRaw) {
      subscriptionsByPlan[row.plan] = Number(row.count);
    }

    const subscriptionsByStatus: Record<SubscriptionStatus, number> = {} as Record<SubscriptionStatus, number>;
    for (const status of Object.values(SubscriptionStatus) as SubscriptionStatus[]) {
      subscriptionsByStatus[status] = 0;
    }
    for (const row of subsByStatusRaw) {
      subscriptionsByStatus[row.status] = Number(row.count);
    }

    const revenueByPlan: SubscriptionRevenue[] = revenueByPlanRaw.map((row) => ({
      plan: row.plan,
      revenue: Number(row.revenue || 0),
      count: Number(row.count),
    }));

    const totalRevenue = revenueByPlan.reduce((sum, r) => sum + r.revenue, 0);

    const subscriptionsByMonth = subsByMonthRaw.map((row) => ({
      month: row.month,
      subscriptions: Number(row.subscriptions),
      cancellations: Number(row.cancellations),
      revenue: Number(row.revenue || 0),
    }));

    const dto = new SubscriptionStatsDto();
    dto.totalSubscriptions = totalSubscriptions;
    dto.subscriptionsByPlan = subscriptionsByPlan;
    dto.subscriptionsByStatus = subscriptionsByStatus;
    dto.totalRevenue = totalRevenue;
    dto.revenueByPlan = revenueByPlan;
    dto.subscriptionsByMonth = subscriptionsByMonth;

    return dto;
  }

  async getGenreStats(filter: DashboardFilter): Promise<GenreStatsDto> {
    const [totalGenres, genresBySongCountRaw, genresByViewsRaw] = await Promise.all([
      this.genreRepository.count(),
      this.genreRepository
        .createQueryBuilder("g")
        .leftJoin("songs", "s", "s.genre_id = g.id")
        .select("g.id", "genreId")
        .addSelect("g.genre_name", "genreName")
        .addSelect("COUNT(DISTINCT s.id)", "songCount")
        .groupBy("g.id")
        .orderBy("songCount", "DESC")
        .getRawMany(),
      this.genreRepository
        .createQueryBuilder("g")
        .leftJoin("songs", "s", "s.genre_id = g.id")
        .select("g.id", "genreId")
        .addSelect("g.genre_name", "genreName")
        .addSelect("SUM(s.views)", "totalViews")
        .groupBy("g.id")
        .orderBy("totalViews", "DESC")
        .getRawMany(),
    ]);

    const genresBySongCount: GenreStat[] = genresBySongCountRaw.map((row) => ({
      genreId: row.genreId,
      genreName: row.genreName,
      songCount: Number(row.songCount),
      totalViews: 0,
    }));

    const genresByViews: GenreStat[] = genresByViewsRaw.map((row) => ({
      genreId: row.genreId,
      genreName: row.genreName,
      songCount: 0,
      totalViews: Number(row.totalViews || 0),
    }));

    const dto = new GenreStatsDto();
    dto.totalGenres = totalGenres;
    dto.genresBySongCount = genresBySongCount;
    dto.genresByViews = genresByViews;

    return dto;
  }
}

