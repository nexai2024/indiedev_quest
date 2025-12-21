"use client"

import { useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import CourseDetailBannner from './_components/CourseDetailBannner'
import axios from 'axios';
import { Course } from '../_components/CourseList';
import CourseChapters from './_components/CourseChapters';
import CourseStatus from './_components/CourseStatus';
import UpgradeToPro from '../../dashboard/_components/UpgradeToPro';
import CommunityHelpSection from './_components/CommunityHelpSection';

type CourseDetail = {

}

function CourseDetail() {
    const { courseId } = useParams();
    const [CourseDetail,setCourseDetail]=useState<Course>();
    const [loading,setLoading]=useState(false);

    useEffect(()=>{
        courseId && GetCourseDetail();
    },[courseId])


    const GetCourseDetail= async()=>{
        setLoading(true);
        const result=await  axios.get('/api/course?courseid='+courseId);
        console.log(result.data);
        setCourseDetail(result?.data);
        setLoading(false);
    }


  return (
    <div>
      <CourseDetailBannner loading={loading}
            courseDetail={CourseDetail}
            refreshData={()=>GetCourseDetail()}
      />

      <div className='grid grid-cols-3 p-10 md:px-24 lg:px-36 gap-7'>

        <div className='col-span-2'>
          <CourseChapters
           loading={loading}
            courseDetail={CourseDetail}/>

        </div>

        <div>
          <CourseStatus courseDetail={CourseDetail}/>
          <UpgradeToPro/>
          <CommunityHelpSection/>
        </div>
      </div>
    </div>
  )
}

export default CourseDetail
