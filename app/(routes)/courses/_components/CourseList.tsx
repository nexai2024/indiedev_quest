"use client"
import axios from 'axios'

import { ChartNoAxesColumnIncreasingIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

export type Course={
    id:number,
    courseId:number,
    title:string,
    desc:string,
    level:string,
    bannerImage:string,
    tag:string
    chapters?:Chapter,
    userEnrolled?:boolean,
    courseEnrolledInfo?:CourseEnrolledInfo,
    completeExercise?: CompleteExercise[]
}

export type CourseEnrolledInfo={
  xpEarned:number,
  enrolledDate: any,
}

export type Chapter={
  chapterId:number,
  courseId:number,
  desc:string,
  name:string,
  id:number,
  exercises:exercise[]
}

export type exercise={
  name:string,
  slug:string,
  xp:number,
  difficulty: string
}

export type CompleteExercise={
  chapterId:number,
  courseId:number,
  exerciseId:number,
}

type Props={
  smallerCard?:boolean,
  maxLimit?:number
}

function CourseList({smallerCard=false,maxLimit}:Props) {
    const [CourseList,setCourseList]=useState<Course[]>([]);
    const[loading,setLoading]=useState(false);

    useEffect(()=>{
        GetAllCourses();
    },[])


    const GetAllCourses=async()=>{
        setLoading(true);
        const result=await axios.get('/api/course');
        console.log(result);
        setCourseList(result?.data);
        setLoading(false);
    }
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-5 mt-3'>

      {CourseList?.map((course,index)=>(
        <Link href={'/courses/'+course?.courseId} key={index} >
        <div className='border-4 rounded-2xl hover:bg-zinc-900 cursor-pointer '>
            <Image src={(course?.bannerImage).trimEnd()} width={450} height={400}
                       alt={course?.title}
                       className={`w-full ${smallerCard?'h-[120px]': 'h-[200px] '} object-cover rounded-t-lg`}
            />
            <div className='p-4'>
                <h2 className='font-game text-2xl '>{course?.title}</h2>
                <p className='font-game text-xl text-gray-400 line-clamp-2'>{course?.desc}</p>
                <h2 className='bg-zinc-800 flex gap-2 font-game p-2 px-4 mt-3 rounded-2xl items-center inline-flex'>
                    <ChartNoAxesColumnIncreasingIcon className='h-4 w-4'/>
                    {course.level}
                </h2>
            </div>
        </div>
        </Link>
      ))}
    </div>
  )
}

export default CourseList
