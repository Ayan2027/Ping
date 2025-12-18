import React, { useState } from 'react'
import { dummyUserData } from '../assets/assets'
import { Pencil } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../features/user/userSlice';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

const ProfileModal = ({setShowEdit}) => {

    const dispatch = useDispatch();
    const {getToken} = useAuth()

    const user = useSelector((state) => state.user.value)
    const [editForm, setEditForm] = useState({
        username: user.username,
        bio: user.bio,
        location: user.location,
        profile_picture: null,
        cover_photo: null,
        full_name: user.full_name,
    })

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {

            const userData = new FormData();
            const {full_name, username, bio, location, profile_picture, cover_photo} = editForm

            userData.append('username', username);
            userData.append('bio', bio);
            userData.append('location', location);
            userData.append('full_name', full_name);
            profile_picture && userData.append('profile', profile_picture)
            cover_photo && userData.append('cover', cover_photo)

            const token = await getToken()
            dispatch(updateUser({userData, token}))

            setShowEdit(false)
        } catch (error) {
            toast.error(error.message)
        }
    }

  return (
    <div className='fixed top-0 bottom-0 left-0 right-0 z-110 h-screen overflow-y-scroll bg-black/50'>
      <div className='max-w-2xl sm:py-6 mx-auto'>
        <div className='bg-white rounded-lg shadow p-6'>
            <h1 className='text-2xl font-bold text-gray-900 mb-6'>Edit Profile</h1>

            
        </div>
      </div>
    </div>
  )
}

export default ProfileModal