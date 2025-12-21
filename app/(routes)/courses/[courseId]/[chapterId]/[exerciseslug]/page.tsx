"use client"
import axios from 'axios';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import SplitterLayout from 'react-splitter-layout';
import 'react-splitter-layout/lib/index.css';
import { CompleteExercise, exercise } from '../../../_components/CourseList';
import ContentSection from './_components/ContentSection';
import CodeEditor from './_components/CodeEditor';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export type courseExercise={
  chapterId:number,
  courseId:number,
  desc:string,
  name:string,
  editorType?:string,
  exercises:exercise[],
  exerciseData:ExerciseData,
  completedExercise: CompleteExercise[]
}

type ExerciseData={
  chapterId:number,
  courseId:number,
  exerciseId:string,
  exerciseName:string,
  exerciseContent:ExerciseContent
}

type ExerciseContent={
  content:string,
  hint:string,
  hintXp:string,
  starterCode:any,
  task:string
}



function Playground() {

    const {courseId,chapterId,exerciseslug}=useParams();
    const [loading,setLoading] = useState(false)

    const [courseExerciseData,setCourseExerciseData]=useState<courseExercise>();
    const [exerciseInfo,setExerciseInfo] = useState<exercise>();
    const [nextButtonRoute, setNextButtonRoute]=useState<string>();
    const [prevButtonRoute, setPrevButtonRoute]=useState<string>();

    useEffect(()=>{
      GetExerciseCourseDetail()
    },[])

    useEffect(() => {
  if (courseExerciseData && exerciseslug) {
    GetPrevNextButtonRoute();
  }
}, [courseExerciseData, exerciseslug]);

    const GetExerciseCourseDetail=async()=>{
      setLoading(true);
      const result=await axios.post('/api/exercise',{
        courseId:courseId,
        chapterId:chapterId,
        exerciseId:exerciseslug

      })

      console.log(result.data);
      setCourseExerciseData(result.data);
      setLoading(false);
    }

    useEffect(()=>{
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = ' '
      }
    })

    useEffect(()=>{
      courseExerciseData&& GetExerciseDetail();
    },[courseExerciseData])


    const GetExerciseDetail=()=>{
      const exerciseInfo = courseExerciseData?.exercises?.find((item)=>item.slug==exerciseslug);
      setExerciseInfo(exerciseInfo);
    }

  const GetPrevNextButtonRoute=()=>{
    if (!courseExerciseData?.exercises) return;

    const currentExerciseIndex=courseExerciseData?.exercises?.findIndex(item=>item.slug==exerciseslug)??0;

    const NextExercise=courseExerciseData?.exercises[currentExerciseIndex+1]?.slug;
    const PrevExercise=courseExerciseData?.exercises[currentExerciseIndex-1]?.slug;

    console.log("Next Slug:", NextExercise);

    setNextButtonRoute(NextExercise?'/courses/'+courseId+'/'+chapterId+'/'+NextExercise:undefined);
    setPrevButtonRoute(PrevExercise?'/courses/'+courseId+'/'+chapterId+'/'+PrevExercise:undefined);
  }

  return (
    <div className='border-t-4'>
        <SplitterLayout percentage
        primaryMinSize={40}
        secondaryMinSize={60}
        >
           <div>
            <ContentSection courseExerciseData={courseExerciseData}
            loading={loading}
            />
           </div>
           <div>
            <CodeEditor courseExerciseData={courseExerciseData}
            loading={loading}/>
           </div>
        </SplitterLayout>


        <div className='font-game fixed bottom-0 w-full bg-zinc-900 flex  p-4 justify-between items-center'>
              <Link href={prevButtonRoute??'/courses/'+courseId}>
                  <Button variant={'pixel'} className='text-xl'> Previous</Button>
                  </Link>
                  <div className='flex gap-3 items-center'>
                    <Image src='/star.png' alt='star' width={40} height={40}/>
                    <h2 className='text-2xl'>You can Earn <span className='text-2.5xl'>{exerciseInfo?.xp} </span>  Xp</h2>
                  </div>
                  <Link href={nextButtonRoute??'/courses/'+courseId}>
                  <Button variant={'pixel'} className='text-xl'> Next</Button></Link>
        </div>
      
    </div>
  )
}

export default Playground
