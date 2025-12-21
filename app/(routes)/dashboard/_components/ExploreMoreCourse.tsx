import React from 'react'
import CourseList from '../../courses/_components/CourseList'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

function ExploreMoreCourse() {
  return (
    <div>
        <div className='mt-7 flex justify-between items-center'>
      <h2 className='text-3xl mb-2 font-game'>Explore Other Courses</h2>
      <Link href={'/courses'}>
        <Button className='font-game text-lg' variant={'pixel'}>View All</Button>
      
      </Link>
       </div>
      <CourseList smallerCard={true} maxLimit={2}/>
    </div>
  )
}

export default ExploreMoreCourse
