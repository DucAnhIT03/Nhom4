import Header from "../components/HomePage/Header";
import Sidebar from "../components/HomePage/Sidebar";
import Footer from "../components/HomePage/Footer";
import Container from "../components/History/Container";
function History() {
  return (
    <>
      <div className=" bg-[#14182A] w-[1540px] h-auto">
        <Header />
        <Sidebar />
        <Container />
        <Footer />
      </div>
    </>
  )
}

export default History