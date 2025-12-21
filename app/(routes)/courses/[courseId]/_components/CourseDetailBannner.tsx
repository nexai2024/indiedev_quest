import React, { useState } from 'react'
import { Course } from '../../_components/CourseList'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Loader2Icon } from 'lucide-react'
import axios from 'axios';
import { toast } from 'sonner'

type Props={
    loading:boolean,
    courseDetail:Course | undefined,
    refreshData:()=>void
}

function CourseDetailBannner({loading, courseDetail, refreshData} : Props) {

  const [loading_,setLoading_]=useState(false);

  const EnrollCourse= async ()=>{
    setLoading_(true);
    const result=await axios.post('/api/enroll-course',{
      courseId: courseDetail?.courseId
    })
    console.log(result);
    toast.success('Course Enrolled!')
    refreshData();
    setLoading_(false);

  }
  return (
    <div className='relative'>
        {!courseDetail?
        <Skeleton className='w-full h-[300px] rounded-2xl'/>
        : <div>
            <Image src={courseDetail?.bannerImage.trimEnd()} alt={courseDetail?.title} width={1400} height={550}
            className='w-full h-[300px] object-cover'/> 

            <div className='font-game absolute top-0 pt-15 p-10 md:px-24 lg:px-20 bg-linear-to-r from-black/80 to-white-50/50 h-full'>
                <h2 className='text-6xl'>{courseDetail?.title}</h2>
                <p className='text-3xl mt-4 text-black-100'>{courseDetail?.desc}</p>
                {!courseDetail?.userEnrolled?  <Button className='text-2xl mt-8' variant={'pixel'} size={'lg'} 
                disabled={loading_}
                onClick={EnrollCourse}>
                  {loading_&&<Loader2Icon className='animate-spin'/>}
                  Enroll Now</Button>
                  :
                  <Button className='text-2xl mt-7' size={'lg'} variant={'pixel'}>Continue Learning....</Button>}
            </div>
        </div>
        }
    </div>
  )
}

export default CourseDetailBannner
