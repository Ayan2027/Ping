import React, { useEffect, useState } from 'react'
import {Users, UserPlus, UserCheck, UserRoundPen, MessageSquare} from 'lucide-react'
import { useNavigate } from 'react-router-dom';
import {useSelector, useDispatch} from 'react-redux'
import { useAuth } from '@clerk/clerk-react';
import { fetchConnections } from '../features/connections/connectionsSlice';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Connections = () => {

  const [currentTab, setCurrentTab] = useState('Followers')

  const navigate = useNavigate()
  const { getToken } = useAuth()
  const dispatch = useDispatch()

  const {connections, pendingConnections, followers, following} = useSelector((state)=>state.connections)

  const dataArray = [
    {label: 'Followers', value: followers, icon: Users },
    {label: 'Following', value: following, icon: UserCheck },
    {label: 'Pending', value: pendingConnections, icon: UserRoundPen },
    {label: 'Connections', value: connections, icon: UserPlus },
  ]

  const handleUnfollow = async (userId) => {
    try {
      const { data } = await api.post('/api/user/unfollow', {id: userId}, {
        headers: { Authorization: `Bearer ${await getToken()}`}
      })
      if (data.success){
        toast.success(data.message)
        dispatch(fetchConnections(await getToken()))
      }else{
        toast(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

   const acceptConnection = async (userId) => {
    try {
      const { data } = await api.post('/api/user/accept', {id: userId}, {
        headers: { Authorization: `Bearer ${await getToken()}`}
      })
      if (data.success){
        toast.success(data.message)
        dispatch(fetchConnections(await getToken()))
      }else{
        toast(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(()=>{
    getToken().then((token)=>{
      dispatch(fetchConnections(token))
    })
  },[])

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-6xl mx-auto p-6'>

      {/* Title */}
      <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 mb-2'>Connections</h1>
          <p className='text-slate-600'>Manage your network and discover new connections</p>
      </div>

      {/* Counts */}
      <div className='mb-8 flex flex-wrap gap-6'>
        {dataArray.map((item, index)=>(
          <div key={index} className='flex flex-col items-center justify-center gap-1 border h-20 w-40 border-gray-200 bg-white shadow rounded-md'>
            <b>{item.value.length}</b>
            <p className='text-slate-600'>{item.label}</p>
          </div>
        ))}
      </div>

       
       

      </div>
    </div>
  )
}

export default Connections