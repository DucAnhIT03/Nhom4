import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ToggleWishlistDto {
  userId: number;
  songId: number;
}

export interface WishlistItem {
  song: {
    id: number;
    title: string;
    duration?: string;
    artistId: number;
    albumId?: number;
    fileUrl?: string;
    type?: 'FREE' | 'PREMIUM';
    views: number;
    createdAt?: string;
    updatedAt?: string;
    artist?: {
      id: number;
      artistName: string;
    };
  };
  wishlist: {
    userId: number;
    songId: number;
  };
}

export interface ToggleWishlistResponse {
  isFavorite: boolean;
}

/**
 * Toggle wishlist (thêm hoặc xóa bài hát khỏi danh sách yêu thích)
 */
export const toggleWishlist = async (userId: number, songId: number): Promise<ToggleWishlistResponse> => {
  const token = localStorage.getItem('token');
  const response = await axios.post<ToggleWishlistResponse>(
    `${API_BASE_URL}/library/wishlist/toggle`,
    { userId, songId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

/**
 * Lấy danh sách bài hát yêu thích của user
 */
export const getWishlist = async (userId: number): Promise<WishlistItem[]> => {
  const token = localStorage.getItem('token');
  const response = await axios.get<WishlistItem[]>(
    `${API_BASE_URL}/library/wishlist/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

/**
 * Lấy danh sách song IDs trong wishlist của user
 */
export const getWishlistSongIds = async (userId: number): Promise<number[]> => {
  try {
    const wishlist = await getWishlist(userId);
    return wishlist.map(item => item.song.id);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return [];
  }
};

