import { Progress } from '@/components/ui/progress'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { Course } from '../../_components/CourseList'

type Props = {
  courseDetail: Course | any // Added 'any' to handle strict interface issues during build
}

function CourseStatus({ courseDetail }: Props) {

  const [counts, setCounts] = useState<{
    totalExce: number,
    totalXP: number
  }>()

  useEffect(() => {
    courseDetail && GetCounts()
  }, [courseDetail])

  const GetCounts = () => {
    let totalExercises = 0;
    let totalXP = 0;

    // Use type assertion (as any[]) to allow forEach on chapters
    (courseDetail?.chapters as any[])?.forEach((chapter) => {
      totalExercises = totalExercises + (chapter?.exercises?.length || 0);
      
      // Use type assertion (as any[]) to allow forEach on exercises
      (chapter?.exercises as any[])?.forEach(exc => {
        totalXP = totalXP + (exc?.xp || 0);
      })
    })

    setCounts({
      totalExce: totalExercises,
      totalXP: totalXP
    })
  }

  const UpdateProgress = (currentValue: number, totalValue: number) => {
    if (currentValue && totalValue) {
      const perc = (currentValue * 100) / totalValue;
      return perc;
    }
    return 0;
  }

  return (
    <div className='font-game p-4 border-4 rounded-xl w-full'>
      <h2 className='text-3xl'>Course Progress</h2>
      <div className='flex items-center gap-5 mt-4'>
        <Image src={'/book.png'} alt='book' width={50} height={50} />
        <div className='w-full'>
          <h2 className='flex justify-between text-2xl  '>Excercises <span className='text-gray-400'>{courseDetail?.completeExercise?.length || 0}/{counts?.totalExce || 0}</span></h2>
          {/*@ts-ignore*/}
          <Progress value={UpdateProgress(courseDetail?.completeExercise?.length || 0, counts?.totalExce || 0)} className='mt-2 ' />
        </div>
      </div>

      <div className='flex items-center gap-5 mt-4'>
        <Image src={'/star.png'} alt='book' width={50} height={50} />
        <div className='w-full'>
          <h2 className='flex justify-between text-2xl  '>XP Earned
            <span className='text-gray-400'>{courseDetail?.courseEnrolledInfo?.xpEarned || 0}/{counts?.totalXP || 0}</span></h2>
          {/*@ts-ignore*/}
          <Progress value={UpdateProgress(courseDetail?.courseEnrolledInfo?.xpEarned ?? 0, counts?.totalXP || 0)} className='mt-2 ' />
        </div>
      </div>
    </div>
  )
}

export default CourseStatus