import Header from "../components/HomePage/Header";
import Sidebar from "../components/HomePage/Sidebar";
import Footer from "../components/HomePage/Footer";
import UserCommentManagement from "../components/UserCommentManagement/UserCommentManagement";

function MyComments() {
  return (
    <>
      <div className="bg-[#14182A] w-[1540px] h-auto min-h-screen">
        <Header />
        <Sidebar />
        <div className="ml-[240px] pt-[80px] pb-8">
          <UserCommentManagement />
        </div>
        <Footer />
      </div>
    </>
  );
}

export default MyComments;

