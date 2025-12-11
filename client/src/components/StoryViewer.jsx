import { BadgeCheck, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'

const StoryViewer = ({viewStory, setViewStory}) => {

    const [progress, setProgress] = useState(0)

    useEffect(()=>{
        let timer, progressInterval;

        if(viewStory && viewStory.media_type !== 'video'){
            setProgress(0)

            const duration = 10000;
            const setTime = 100;
            let elapsed = 0;

           progressInterval = setInterval(() => {
                elapsed += setTime;
                setProgress((elapsed / duration) * 100);
            }, setTime);

             // Close story after duration(10sec)
             timer = setTimeout(()=>{
                setViewStory(null)
             }, duration)
        }

        return ()=>{
            clearTimeout(timer);
            clearInterval(progressInterval)
        }

    }, [viewStory, setViewStory])

    const handleClose = ()=>{
        setViewStory(null)
    }

    if(!viewStory) return null

    const renderContent = ()=>{
        switch (viewStory.media_type) {
            case 'image':
                return (
                    <img src={viewStory.media_url} alt="" className='max-w-full max-h-screen object-contain'/>
                );
            case 'video':
                return (
                    <video onEnded={()=>setViewStory(null)} src={viewStory.media_url} className='max-h-screen' controls autoPlay/>
                );
            case 'text':
                return (
                    <div className='w-full h-full flex items-center justify-center p-8 text-white text-2xl text-center'>
                        {viewStory.content}
                    </div>
                );
        
            default:
                return null;
        }
    }

  return (
    <div className='fixed inset-0 h-screen bg-black bg-opacity-90 z-110 flex items-center justify-center' style={{backgroundColor: viewStory.media_type === 'text' ? viewStory.background_color : '#000000'}}>
      
      {/* Progress Bar */}
      <div className='absolute top-0 left-0 w-full h-1 bg-gray-700'>
        <div className='h-full bg-white transition-all duration-100 linear' style={{width: `${progress}%`}}>

        </div>
      </div>
      

      

       {/* Content Wrapper */}
       <div className='max-w-[90vw] max-h-[90vh] flex items-center justify-center'>
            {renderContent()}
       </div>
    </div>
  )
}

export default StoryViewer