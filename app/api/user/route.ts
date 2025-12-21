import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest) {

    const user=await currentUser();

    //If user already exists??
    const users=await db.select().from(usersTable)
    //@ts-ignore
    .where(eq(usersTable.email,user?.primaryEmailAddress?.emailAddress))

    // If not the create new user record
    if(users?.length<=0){
        const newUser ={
            name:user?.fullName??'',
            email:user?.primaryEmailAddress?.emailAddress??'',
            points:0
        }
        const result=await db.insert(usersTable)
        .values(newUser).returning()

        return NextResponse.json(result[0])
    }

    return NextResponse.json(users[0])
    
}