import Header from "../components/HomePage/Header"
import Sidebar from "../components/HomePage/Sidebar"
import Container from "../components/Genres/Container"
import Footer from "../components/HomePage/Footer"
function App() {
  return (
    <>
      <div className=" bg-[#14182A] w-[1520px] h-auto">
        <Header />
        <Sidebar/>
        <Container/>
        <Footer/>
      </div>
    </>
  )
}

export default App
