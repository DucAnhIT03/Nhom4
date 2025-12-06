import Header from "../components/HomePage/Header"
import Sidebar from "../components/HomePage/Sidebar"

import Footer from "../components/HomePage/Footer"
import Container from "../components/Artists/Container"
function Artists() {
  return (
    <>
      <div className=" bg-[#14182A] w-[1520px] h-auto">
        <Header/>
        <Sidebar/>
        
        <Container/>
        <Footer/>
      </div>
   
    </>
  )
}

export default Artists
