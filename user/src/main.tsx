import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

// --- LAZY IMPORT PAGES ---

// 1. Trang User (Giao diện chung)
const HomePage = lazy(() => import("./pages/App.tsx")); 

// 2. Trang Chức năng chung
const Artists = lazy(() => import("./pages/Artists.tsx"));
const ArtistDetail = lazy(() => import("./pages/ArtistDetail.tsx"));
const Genres = lazy(() => import("./pages/Genres.tsx"));
const GenrePage = lazy(() => import("./components/Genres/GenrePage.tsx"));
const TopTrack = lazy(() => import("./pages/Toptracks.tsx"));

// 3. Album Pages
const AlbumList = lazy(() => import("./pages/Album.tsx"));       
const AlbumDetail = lazy(() => import("./pages/AlbumDetail.tsx")); 

// 4. User Personal Pages (Cá nhân)
const Downloads = lazy(() => import("./pages/Dowloads.tsx"));
const Favourites = lazy(() => import("./pages/Favourites.tsx"));
const History = lazy(() => import("./pages/History.tsx"));

// 5. ARTIST PAGES (MỚI THÊM)
// Đây là trang đích sau khi đăng nhập với role Artist
const ArtistDashboard = lazy(() => import("./pages/ArtistDashboard.tsx"));


// --- ROUTER CONFIGURATION ---
const router = createBrowserRouter([
  // === USER ROUTES ===
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "artists",
    element: <Artists />,
  },
  {
    path: "artist/:id",
    element: <ArtistDetail />,
  },
  {
    path: "genres",
    element: <Genres />,
  },
  {
    path: "genre/:genreName",
    element: <GenrePage />,
  },
  {
    path: "toptracks",
    element: <TopTrack />,
  },
  
  // --- Album Routes ---
  {
    path: "album",
    element: <AlbumList />, 
  },
  {
    path: "album/:id",      
    element: <AlbumDetail />, 
  },

  // --- Personal Routes ---
  {
    path: "dowload", // Giữ nguyên typo theo yêu cầu
    element: <Downloads />,
  },
  {
    path: "favorite",
    element: <Favourites />,
  },
  {
    path: "history",
    element: <History />,
  },

  // === ARTIST ROUTES (MỚI THÊM) ===
  {
    // Đường dẫn này khớp với code: window.location.href = "/artist/dashboard"
    path: "artist/dashboard", 
    element: <ArtistDashboard />,
  },
]);

// --- RENDER APP ---
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-[#171C36] text-white font-semibold text-lg">
        Loading...
      </div>
    }>
      <RouterProvider router={router} />
    </Suspense>
  </StrictMode>
);