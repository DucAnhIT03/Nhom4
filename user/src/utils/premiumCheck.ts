/**
 * Kiểm tra xem user có thể nghe bài hát premium không
 * @param song - Bài hát cần kiểm tra
 * @returns Promise với kết quả kiểm tra
 */
export const canPlayPremiumSong = async (
  song: { type?: 'FREE' | 'PREMIUM'; artistId?: number | null }
): Promise<{ canPlay: boolean; reason?: string }> => {
  // Nếu không phải premium, cho phép nghe
  if (!song.type || song.type === 'FREE') {
    return { canPlay: true };
  }

  // Nếu là premium, kiểm tra:
  // 1. User có phải là nghệ sĩ sở hữu bài hát không
  // 2. User có premium subscription không

  // Kiểm tra nếu user là nghệ sĩ sở hữu bài hát
  if (isSongOwner(song.artistId)) {
    return { canPlay: true };
  }

  // Kiểm tra subscription từ API
  const userId = localStorage.getItem('userId');
  if (!userId) {
    return {
      canPlay: false,
      reason: 'Vui lòng đăng nhập để nghe bài hát Premium.'
    };
  }

  try {
    const { isUserPremium } = await import('../services/subscription.service');
    const isPremium = await isUserPremium(parseInt(userId));

    if (!isPremium) {
      return {
        canPlay: false,
        reason: 'Bài hát này yêu cầu tài khoản Premium. Vui lòng nâng cấp tài khoản để nghe bài hát này.'
      };
    }

    return { canPlay: true };
  } catch (error) {
    console.error('Error checking premium status:', error);
    // Nếu có lỗi khi check, vẫn chặn để đảm bảo an toàn
    return {
      canPlay: false,
      reason: 'Không thể xác thực tài khoản Premium. Vui lòng thử lại.'
    };
  }
};

/**
 * Kiểm tra xem user có phải là nghệ sĩ sở hữu bài hát không
 * @param songArtistId - ID của nghệ sĩ sở hữu bài hát
 * @returns true nếu là chủ sở hữu
 */
export const isSongOwner = (
  songArtistId: number | null | undefined
): boolean => {
  if (!songArtistId) return false;
  
  // Lấy artistId của user hiện tại từ localStorage (đã được lưu khi vào ArtistDashboard)
  const userArtistId = localStorage.getItem('artistId');
  if (userArtistId && parseInt(userArtistId) === songArtistId) {
    return true;
  }
  
  return false;
};

