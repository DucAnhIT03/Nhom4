import { Outlet } from "react-router-dom";
import MusicPlayerBar from "../../components/HomePage/MusicPlayerBar";
import { useMusic } from "../../contexts/MusicContext";

const Layout = () => {
  const { currentlyPlayingSong } = useMusic();

  return (
    <>
      <Outlet />
      <MusicPlayerBar song={currentlyPlayingSong} />
    </>
  );
};

export default Layout;

