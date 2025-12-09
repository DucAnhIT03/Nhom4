
import { LuPhoneCall } from "react-icons/lu";
import { TfiEmail } from "react-icons/tfi";
import { IoLocationOutline } from "react-icons/io5";
import { FaFacebookF, FaLinkedinIn, FaTwitter ,FaGooglePlusG } from "react-icons/fa";
import { useLanguage } from "../../contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();
  return (

    <div className="  h-[602px] bg-[#14182A]/30 bg-gradient-to-r   from-[#14182A] via-[#20A7C4]/30 to-[#14182A] mt-[81px]">
    <div className="flex">
      <img className=" mt-[48px] ml-[697px] " src="./Footer/LogoFooter.png" alt="" />
    </div>     
      <div className="flex mt-[48px]">
        <div className="w-[270px] h-[218px]  ml-[160px] mr-[30px]">

 <h3 className=" text-[18px] font-semibold text-[#3BC8E7]  h-[26px] w-[210px] mb-[24px]">{t('footer.companyName')}</h3>
        <h3 className="text-[15px] text-white">{t('footer.companyDescription')}</h3>

    </div>

    <div className="w-[277px] h-[301px] mr-[25px]">
      <h3 className=" text-[18px] font-semibold text-[#3BC8E7]  h-[26px] w-[161spx] mb-[24px]">{t('footer.downloadApp')}</h3>
      <h3 className="text-white text-[15px]">{t('footer.goMobile')}
        </h3>
        <h3 className="text-white text-[15px] mb-[16px]">{t('footer.listenFavorite')}</h3>
      
      <a   href=""><img className=" rounded-[5px] mb-[20px] "  src=" ./Footer/googleplay.jpg" alt="" /></a>
      <a href=""><img className=" rounded-[5px] mb-[20px] " src="./Footer/appstore.jpg" alt="" /></a>
      <a href=""><img className="rounded-[5px]" src="./Footer/Window.jpg" alt="" /></a>
    </div>
    
    <div className="w-[257.3399963378906px] h-[278px] mr-[41.66px]">
      <h3 className=" text-[18px] font-semibold text-[#3BC8E7]  h-[22px] w-[80px] mb-[24px]">{t('footer.subscribe')}</h3>
      <h3 className="text-[15px] mb-[16px] text-white">{t('footer.subscribeDescription')}</h3>

<input
        type="text"
        placeholder={t('footer.enterName')}
        className="flex-1 px-3 text-sm text-black focus:outline-none bg-white w-[257.3399963378906px] h-[38px] rounded-[5px] mb-[20px] "
        
      />
      <input
        type="text"
        placeholder={t('footer.enterEmail')}
        className="flex-1 px-3 text-sm text-black focus:outline-none bg-white w-[257.3399963378906px] h-[38px] rounded-[5px] mb-[20px]"
        
      />

      <button className="bg-[#3BC8E7] w-[121px] h-[48px] rounded-[20px] text-white">
        {t('footer.signMeUp')}

      </button>

    </div>
    <div className="w-[261px] h-[325px] text-[15px] text-white ">
       <h3 className=" text-[18px] font-semibold text-[#3BC8E7]  h-[22px] w-[93px] mb-[24px]">{t('footer.contactUs')}</h3>
       <div className="w-[261px] h-[75px] flex mb-[8px] gap-5">
        <div className="bg-[#20A7C4] w-[40px] h-[40px] flex justify-center items-center rounded-[5px]">
        <LuPhoneCall className="w-[20px] h-[20px] "/> 
       </div>
        <span className="w-[195px] h-[72px]">
        <h3 > {t('footer.callUs')} :</h3>
        <h3 className="" >(+1) 202-555-0176, (+1) 2025-
5501</h3>

        </span>
        </div>
        <div className="w-[261px] h-[78px] flex mb-[8px] gap-5">
        <div className="bg-[#20A7C4] w-[40px] h-[40px] flex justify-center items-center rounded-[5px] ">
        <TfiEmail className="w-[20px] h-[20px]"/>
       </div>
        <span >
        <h3> {t('footer.emailUs')} :</h3>
        <h3 className="w-[112px] h-[24px]" >demo@mail.com </h3>
        <h3 className="w-[124px] h-[24px]">dummy@mail.com</h3>

        </span>
        </div>
        <div className="w-[261px] h-[51px] flex mb-[3px] gap-5">
        <div className="bg-[#20A7C4] w-[40px] h-[40px] flex justify-center items-center rounded-[5px] text-white">
        <IoLocationOutline className="w-[20px] h-[20px]"/>
       </div>
        <span className="">
        <h3> {t('footer.walkIn')} :
        </h3>
        <h3 className="w-[201px] h-[48px]" >598 Old House Drive, London</h3>
        </span>
        
        </div>

        <div>
          <div className="w-[232px] h-[30px] flex  items-center mt-[16px]">
          <h3 className="w-[72px] h-[24px]">{t('footer.followUs')} :</h3>
          <div className="bg-[#20A7C4] w-[30px] h-[30px] flex justify-center items-center rounded-[5px] ml-[16px] ">
        <FaFacebookF  className="w-[7.23px] h-[13.93px]"/>
       </div>
       <div className="bg-[#20A7C4] w-[30px] h-[30px] flex justify-center items-center rounded-[5px] ml-[8px] ">
        <FaLinkedinIn  className="w-[12.86px] h-[12.29px]"/>
       </div>
       <div className="bg-[#20A7C4] w-[30px] h-[30px] flex justify-center items-center rounded-[5px] ml-[8px] ">
        <FaTwitter  className="w-[14px] h-[13px]"/>
       </div>
       <div className="bg-[#20A7C4] w-[30px] h-[30px] flex justify-center items-center rounded-[5px] ml-[8px]">
        <FaGooglePlusG  className="w-[20x] h-[13px]"/>
       </div>


        </div>
        </div>

    </div>
      </div>
      <span className="flex gap-2 ml-[519px] mt-[48px]">
        <h3 className="text-white">{t('footer.copyright')} </h3>
        <h3 className="text-[#3BC8E7]">{t('footer.templateName')}</h3>
        <h3 className="text-white">{t('footer.allRightsReserved')}</h3>
      </span>
    </div>
    
  )
}

export default Footer
