const Banner = () => {
  return (
    <div className=" bg-[#14182A] h-[539px] w-auto ml-20 flex mt-[-511px]">
      <div className=" w-[511px] h-full ml-[88px] ">
        <img src="./Banner/banner.png" alt="" />
      </div>
      <div className=" ml-[0.75px] ">
        <div className="flex-col  ">
          <div className="mt-[54.5px]"><span className=" text-[45px] text-white font-bold ">This Month kk’s </span></div> 
          <div className="mb-[15px]"><span className=" text-[45px] text-[#3BC8E7] font-bold "> Record Breaking Albums !</span></div>
        </div>
        <div className=" mb-[40.5px] w-[677.510009765625px] h-[90px] text-white flex-col ">
          <div className=" text-[15px] leading-[30px] "><span>Dream your moments, Until I Met You, Gimme Some Courage, Dark Alley, One More Of A Stranger,Endless</span></div>
          <div className="text-[15px] leading-[30px]"><span>Things, The Heartbeat Stops, Walking Promises, Desired Games and many more...</span></div>
        </div>
        <div className="text-[15px]">
          <button className="w-[150px] h-[49px] bg-[#3BC8E7] rounded-2xl items-center mr-[29.75px] text-white transition-all duration-300 hover:brightness-125 hover:shadow-[0_0_10px_#3BC8E7]">
            Listen Now
          </button>

           <button className="w-[150px] h-[49px] bg-[#3BC8E7] rounded-2xl items-center text-white transition-all duration-300 hover:brightness-125 hover:shadow-[0_0_10px_#3BC8E7]">
            Add To Queue
          </button>
          
        </div>
       
      
      
      </div>
      
    </div>
    
  )
}

export default Banner
