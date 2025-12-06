import { FaChevronRight } from "react-icons/fa";
import { FaChevronLeft } from "react-icons/fa";
import { HiDotsHorizontal } from "react-icons/hi";
const Container = () => {
  return (
    <div className="mt-[43px]">
      <div className="flex justify-between mt-[-511px]">
        <span className="ml-[160px] text-[#3BC8E7] text-[18px] font-semibold ">
          Top Tracks Of All Time
        </span>
        <span className="mr-[165px] text-white text-[15px]">View more</span>
      </div>

      <div className="flex gap-[30px] mt-[32px] ml-[120px]">
        <button className="text-white">
          <FaChevronLeft />
        </button>

        <div className="text-white w-[175px] h-[256px]">
          <img
            className="rounded-[10px] mb-[19.18px] "
            src="./Toptracks/sing1.jpg"
            alt=""
          />
          <p></p>
          <h3 className="font-semibold mb-1">
            <a href="">Dream Your Moments (Duet)</a>
          </h3>
          <h3 className="text-[#DEDEDE] h-[24px]">Ava Cornish & Brian Hill</h3>
        </div>

        <div className="text-white w-[175px] h-[256px]">
          <img
            className="rounded-[10px] mb-[19.18px]"
            src="./Toptracks/sing2.jpg"
            alt=""
          />
          <h3 className="font-semibold mb-1">Until I Met You</h3>
          <h3 className="text-[#DEDEDE]">Ava Cornish & Brian Hill</h3>
        </div>

        <div className="text-white w-[175px] h-[256px]">
          <img
            className="rounded-[10px] mb-[19.18px]"
            src="./Toptracks/sing3.jpg"
            alt=""
          />
          <h3 className="font-semibold mb-1">Gimme Some Courage</h3>
          <h3 className="text-[#DEDEDE]">Ava Cornish & Brian Hill</h3>
        </div>

        <div className="text-white w-[175px] h-[256px]">
          <img
            className="rounded-[10px] mb-[19.18px]"
            src="./Toptracks/sing4.jpg"
            alt=""
          />
          <h3 className="font-semibold mb-1">Dark Alley Acoustic</h3>
          <h3 className="text-[#DEDEDE]">Ava Cornish & Brian Hill</h3>
        </div>

        <div className="text-white w-[175px] h-[256px]">
          <img
            className="rounded-[10px] mb-[19.18px]"
            src="./Toptracks/sing5.jpg"
            alt=""
          />
          <h3 className="font-semibold mb-1">Walking Promises</h3>
          <h3 className="text-[#DEDEDE]">Ava Cornish & Brian Hill</h3>
        </div>

        <div className="text-white w-[175px] h-[256px]">
          <img
            className="rounded-[10px] mb-[19.18px]"
            src="./Toptracks/sing6.jpg"
            alt=""
          />
          <h3 className="font-semibold mb-1 ">Desired Games</h3>
          <h3 className="text-[#DEDEDE]">Ava Cornish & Brian Hill</h3>
        </div>
        <button className="text-white">
          <FaChevronRight />
        </button>
      </div>

      <div>
        <div>
<h3 className=" text-[#3BC8E7] w-[133px] h-[26px] ml-[160px] mt-[64px]">
            Weekly Top 15
          </h3>
        </div>

        <div className="flex">
          <div className="ml-[160px] mt-[24px]  ">
            <div className="h-[90px] w-[360px] border-b-2 border-[#252B4D] flex items-center">
              <div className="flex text-white">
                <h1 className=" text-[40px] font-bold mr-[21px] w-[39px] h-[50px]">
                  01
                </h1>
                <img
                  className="w-[50px] h-[50px] rounded-[5px] mr-[20px]"
                  src="./Weeklytop15/C1.jpg"
                  alt=""
                />
                <span className="mr-[65.92px] text-[14px]">
                  <h3 className="w-[99px] h-[20px] mb-[6.8px]">
                    <a href="">Until I Met You</a>
                  </h3>
                  <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                </span>
                <h3 className="text-[15px] ">5:10</h3>
                <HiDotsHorizontal className="ml-[24.08px]" />
              </div>
            </div>

            <div className="h-[90px] w-[360px] border-b-2 border-[#252B4D] flex items-center">
              <div className="flex text-white">
                <h1 className=" text-[40px] font-bold mr-[21px] w-[39px] h-[50px]">
                  02
                </h1>
                <img
                  className="w-[50px] h-[50px] rounded-[5px] mr-[20px]"
                  src="./Weeklytop15/C2.png"
                  alt=""
                />
                <span className="mr-[50.92px] text-[14px]">
                  <h3 className="w-[114px] h-[20px] mb-[6.8px]">
                    <a href="">Walking Promises</a>
                  </h3>
                  <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                </span>
                <h3 className="text-[15px] ">5:10</h3>
                <HiDotsHorizontal className="ml-[24.08px]" />
              </div>
            </div>

            <div className="h-[90px] w-[360px] border-b-2 border-[#252B4D] flex items-center">
              <div className="flex text-white">
                <h1 className=" text-[40px] font-bold mr-[21px] w-[39px] h-[50px]">
                  03
                </h1>
                <img
                  className="w-[50px] h-[50px] rounded-[5px] mr-[20px]"
                  src="./Weeklytop15/C3.png"
                  alt=""
                />
                <span className="mr-[19.92px] text-[14px]">
                  <h3 className="w-[145px] h-[20px] mb-[6.8px]">
                    <a href="">Gimme Some Courage</a>
                  </h3>
                  <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                </span>
                <h3 className="text-[15px] ">5:10</h3>
                <HiDotsHorizontal className="ml-[24.08px]" />
              </div>
            </div>
<div className="h-[90px] w-[360px] border-b-2 border-[#252B4D] flex items-center">
              <div className="flex text-white">
                <h1 className=" text-[40px] font-bold mr-[21px] w-[39px] h-[50px]">
                  04
                </h1>
                <img
                  className="w-[50px] h-[50px] rounded-[5px] mr-[20px]"
                  src="./Weeklytop15/C4.png"
                  alt=""
                />
                <span className="mr-[66.92px] text-[14px]">
                  <h3 className="w-[98px] h-[20px] mb-[6.8px]">
                    <a href="">Desired Games</a>
                  </h3>
                  <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                </span>
                <h3 className="text-[15px] ">5:10</h3>
                <HiDotsHorizontal className="ml-[24.08px]" />
              </div>
            </div>

            <div className="h-[90px] w-[360px] border-b-2 border-[#252B4D] flex items-center">
              <div className="flex text-white">
                <h1 className=" text-[40px] font-bold mr-[21px] w-[39px] h-[50px]">
                  05
                </h1>
                <img
                  className="w-[50px] h-[50px] rounded-[5px] mr-[20px]"
                  src="./Weeklytop15/C5.png"
                  alt=""
                />
                <span className="mr-[38.92px] text-[14px]">
                  <h3 className="w-[126px] h-[20px] mb-[6.8px]">
                    <a href="">Dark Alley Acoustic</a>
                  </h3>
                  <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                </span>
                <h3 className="text-[15px] ">5:10</h3>
                <HiDotsHorizontal className="ml-[24.08px]" />
              </div>
            </div>
          </div>

          <div className="ml-[40px] mt-[24px]  ">
            <div className="h-[90px] w-[360px] border-b-2 border-[#252B4D] flex items-center">
              <div className="flex text-white">
                <h1 className=" text-[40px] font-bold mr-[21px] w-[39px] h-[50px]">
                  06
                </h1>
                <img
                  className="w-[50px] h-[50px] rounded-[5px] mr-[20px]"
                  src="./Weeklytop15/C6.png"
                  alt=""
                />
                <span className="mr-[51px] text-[14px]">
                  <h3 className="w-[114px] h-[20px] mb-[6.8px]">
                    <a href="">Walking Promises</a>
                  </h3>
                  <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                </span>
                <h3 className="text-[15px] ">5:10</h3>
                <HiDotsHorizontal className="ml-[24.08px]" />
              </div>
            </div>

            <div className="h-[90px] w-[360px] border-b-2 border-[#252B4D] flex items-center">
              <div className="flex text-white">
                <h1 className=" text-[40px] font-bold mr-[21px] w-[39px] h-[50px]">
07
                </h1>
                <img
                  className="w-[50px] h-[50px] rounded-[5px] mr-[20px]"
                  src="./Weeklytop15/C7.png"
                  alt=""
                />
                <span className="mr-[69px] text-[14px]">
                  <h3 className="w-[96px] h-[20px] mb-[6.8px]">
                    <a href="">Endless Things</a>
                  </h3>
                  <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                </span>
                <h3 className="text-[15px] ">5:10</h3>
                <HiDotsHorizontal className="ml-[24.08px]" />
              </div>
            </div>

            <div className="h-[90px] w-[360px] border-b-2 border-[#252B4D] flex items-center">
              <div className="flex text-white">
                <h1 className=" text-[40px] font-bold mr-[21px] w-[39px] h-[50px]">
                  08
                </h1>
                <img
                  className="w-[50px] h-[50px] rounded-[5px] mr-[20px]"
                  src="./Weeklytop15/C8.png"
                  alt=""
                />
                <span className="mr-[23px] text-[14px]">
                  <h3 className="w-[142px] h-[20px] mb-[6.8px]">
                    <a href="">Dream Your Moments</a>
                  </h3>
                  <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                </span>
                <h3 className="text-[15px] ">5:10</h3>
                <HiDotsHorizontal className="ml-[24.08px]" />
              </div>
            </div>
            <div className="h-[90px] w-[360px] border-b-2 border-[#252B4D] flex items-center">
              <div className="flex text-white">
                <h1 className=" text-[40px] font-bold mr-[21px] w-[39px] h-[50px]">
                  09
                </h1>
                <img
                  className="w-[50px] h-[50px] rounded-[5px] mr-[20px]"
                  src="./Weeklytop15/C9.png"
                  alt=""
                />
                <span className="mr-[66px] text-[14px]">
                  <h3 className="w-[99px] h-[20px] mb-[6.8px]">
                    <a href="">Until I Met You</a>
                  </h3>
                  <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                </span>
                <h3 className="text-[15px] ">5:10</h3>
                <HiDotsHorizontal className="ml-[24.08px]" />
              </div>
            </div>

            <div className="h-[90px] w-[360px] border-b-2 border-[#252B4D] flex items-center">
              <div className="flex text-white">
                <h1 className=" text-[40px] font-bold mr-[21px] w-[39px] h-[50px]">
                  10
                </h1>
                <img
                  className="w-[50px] h-[50px] rounded-[5px] mr-[20px]"
                  src="./Weeklytop15/C10.png"
                  alt=""
                />
                <span className="mr-[20px] text-[14px]">
<h3 className="w-[145px] h-[20px] mb-[6.8px]">
                    <a href="">Gimme Some Courage</a>
                  </h3>
                  <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                </span>
                <h3 className="text-[15px] ">5:10</h3>
                <HiDotsHorizontal className="ml-[24.08px]" />
              </div>
            </div>
          </div>

          <div className="ml-[40px] mt-[24px]  ">
            <div className="h-[90px] w-[360px] border-b-2 border-[#252B4D] flex items-center">
              <div className="flex text-white">
                <h1 className=" text-[40px] font-bold mr-[21px] w-[39px] h-[50px]">
                  11
                </h1>
                <img
                  className="w-[50px] h-[50px] rounded-[5px] mr-[20px]"
                  src="./Weeklytop15/C11.png"
                  alt=""
                />
                <span className="mr-[35px] text-[14px]">
                  <h3 className="w-[126px] h-[20px] mb-[6.8px]">
                    <a href="">Dark Alley Acoustic</a>
                  </h3>
                  <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                </span>
                <h3 className="text-[15px] ">5:10</h3>
                <HiDotsHorizontal className="ml-[24.08px]" />
              </div>
            </div>

            <div className="h-[90px] w-[360px] border-b-2 border-[#252B4D] flex items-center">
              <div className="flex text-white">
                <h1 className=" text-[40px] font-bold mr-[21px] w-[39px] h-[50px]">
                  12
                </h1>
                <img
                  className="w-[50px] h-[50px] rounded-[5px] mr-[20px]"
                  src="./Weeklytop15/C12.png"
                  alt=""
                />
                <span className="mr-[25px] text-[14px]">
                  <h3 className="w-[136px] h-[20px] mb-[6.8px]">
                    <a href="">The Heartbeat Stops</a>
                  </h3>
                  <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                </span>
                <h3 className="text-[15px] ">5:10</h3>
                <HiDotsHorizontal className="ml-[24.08px]" />
              </div>
            </div>

            <div className="h-[90px] w-[360px] border-b-2 border-[#252B4D] flex items-center">
              <div className="flex text-white">
                <h1 className=" text-[40px] font-bold mr-[21px] w-[39px] h-[50px]">
                  13
                </h1>
                <img
                  className="w-[50px] h-[50px] rounded-[5px] mr-[20px]"
                  src="./Weeklytop15/C13.png"
                  alt=""
                />
                <span className="mr-[35px] text-[14px]">
                  <h3 className="w-[127px] h-[20px] mb-[6.8px]">
                    <a href="">One More Stranger</a>
                  </h3>
                  <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                </span>
<h3 className="text-[15px] ">5:10</h3>
                <HiDotsHorizontal className="ml-[24.08px]" />
              </div>
            </div>

            <div className="h-[90px] w-[360px] border-b-2 border-[#252B4D] flex items-center">
              <div className="flex text-white">
                <h1 className=" text-[40px] font-bold mr-[21px] w-[39px] h-[50px]">
                  14
                </h1>
                <img
                  className="w-[50px] h-[50px] rounded-[5px] mr-[20px]"
                  src="./Weeklytop15/C14.png"
                  alt=""
                />
                <span className="mr-[48px] text-[14px]">
                  <h3 className="w-[114px] h-[20px] mb-[6.8px]">
                    <a href="">Walking Promises</a>
                  </h3>
                  <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                </span>
                <h3 className="text-[15px] ">5:10</h3>
                <HiDotsHorizontal className="ml-[24.08px]" />
              </div>
            </div>

            <div className="h-[90px] w-[360px] border-b-2 border-[#252B4D] flex items-center">
              <div className="flex text-white">
                <h1 className=" text-[40px] font-bold mr-[21px] w-[39px] h-[50px]">
                  15
                </h1>
                <img
                  className="w-[50px] h-[50px] rounded-[5px] mr-[20px]"
                  src="./Weeklytop15/C15.png"
                  alt=""
                />
                <span className="mr-[65.92px] text-[14px]">
                  <h3 className="w-[96px] h-[20px] mb-[6.8px]">
                    <a href="">Endless Things</a>
                  </h3>
                  <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                </span>
                <h3 className="text-[15px] ">5:10</h3>
                <HiDotsHorizontal className="ml-[24.08px]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-[64px]">
        <div className="flex justify-between">
          <span className="ml-[160px] text-[#3BC8E7] text-[18px] font-semibold ">
            Trending Tracks
          </span>
          <span className="mr-[165px] text-white text-[15px]">View more</span>
        </div>
        <div className="w-[1200px] h-[83px] ">
          <div className="w-[1200px] h-[10px] ml-[160px] mt-[24px]">
            <hr className="text-[#252B4DBF]" />

            <div className="relative flex items-center ">
              <div className="absolute w-[10px] h-[10px] left-[345.5px]  bg-[#3BC8E7] rounded-full">
                <div className="absolute w-[6px] h-[6px] left-[2px] top-[2px] bg-[#14182A] rounded-full"></div>
              </div>
            </div>

            <div className="relative flex items-center">
              <div className="absolute w-[10px] h-[10px] left-[38px]  bg-[#FFFF] rounded-full">
<div className="absolute w-[6px] h-[6px] left-[2px] top-[2px] bg-[#14182A] rounded-full"></div>
              </div>
            </div>

            <div className="relative flex items-center">
              <div className="absolute w-[10px] h-[10px] left-[654px]  bg-[#3BC8E7] rounded-full">
                <div className="absolute w-[6px] h-[6px] left-[2px] top-[2px] bg-[#14182A] rounded-full"></div>
              </div>
            </div>

            <div className="relative flex items-center ">
              <div className="absolute w-[10px] h-[10px] left-[960.5px] bg-[#3BC8E7] rounded-full">
                <div className="absolute w-[6px] h-[6px] left-[2px] top-[2px] bg-[#14182A] rounded-full"></div>
              </div>
            </div>
            <div className="flex mt-[16px]">
              <div className="w-[267px] h-[50px] ml-[10px] flex text-white ">
                <img src="./TrendingTrack/D1.png" alt="" />
                <span className="mr-[6.67px] text-[14px] ml-[20px]">
                  <h3 className="w-[126px] h-[20px] mb-[6.8px]">
                    <a href="">Dark Alley Acoustic</a>
                  </h3>
                  <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                </span>
                <h3 className="text-[15px] ">5:10</h3>
              </div>
              <div className="w-[267px] h-[50px] ml-[40px] flex text-white ">
                <img src="./TrendingTrack/D2.png" alt="" />
                <span className="mr-[6.67px] text-[14px] ml-[20px] ">
                  <h3 className="w-[126px] h-[20px] mb-[6.8px]">
                    <a href="">Dark Alley Acoustic</a>
                  </h3>
                  <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                </span>
                <h3 className="text-[15px] ">5:10</h3>
              </div>
              <div className="w-[267px] h-[50px] ml-[40px] flex text-white">
                <img src="./TrendingTrack/D3.png" alt="" />
                <span className="mr-[6.67px] text-[14px] ml-[20px]">
                  <h3 className="w-[126px] h-[20px] mb-[6.8px]">
                    <a href="">Dark Alley Acoustic</a>
                  </h3>
                  <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                </span>
                <h3 className="text-[15px] ">5:10</h3>
              </div>
              <div className="w-[267px] h-[50px] ml-[40px] flex text-white">
                <img src="./TrendingTrack/D4.png" alt="" />
                <span className="mr-[6.67px] text-[14px] ml-[20px]">
                  <h3 className="w-[126px] h-[20px] mb-[6.8px]">
                    <a href="">Dark Alley Acoustic</a>
                  </h3>
                  <h3 className="w-[78px] h-[20px]">Ava Cornish</h3>
                </span>
                <h3 className="text-[15px] ">5:10</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Container;