import Header from "../components/HomePage/Header"
import Sidebar from "../components/HomePage/Sidebar"

import Banner from "../components/HomePage/Banner"
import Footer from "../components/HomePage/Footer"
import Container from "../components/HomePage/Container"
function App() {
  return (
    <>
      <div className=" bg-[#14182A] w-[1520px] h-auto">
        <Header />
        <Sidebar/>
        <Banner/>
        <Container/>
        <Footer/>
      </div>
    </>
  )
}

export default App
