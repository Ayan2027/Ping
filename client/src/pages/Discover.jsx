import React, { useEffect, useState } from 'react'
import { dummyConnectionsData } from '../assets/assets'
import { Search } from 'lucide-react'
import UserCard from '../components/UserCard'
import Loading from '../components/Loading'
import api from '../api/axios'
import { useAuth } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { fetchUser } from '../features/user/userSlice'

const Discover = () => {

  const dispatch = useDispatch()
  const [input, setInput] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const { getToken } = useAuth()

  const handleSearch = async (e) => {
    if(e.key === 'Enter'){
      try {
        setUsers([])
        setLoading(true)
        const { data } = await api.post('/api/user/discover', {input}, {
          headers: { Authorization: `Bearer ${await getToken()}` }
        })
        data.success ? setUsers(data.users) : toast.error(data.message)
        setLoading(false)
        setInput('')
      } catch (error) {
        toast.error(error.message)
      }
      setLoading(false)
    }
  }

  useEffect(()=>{
    getToken().then((token)=>{
      dispatch(fetchUser(token))
    })
  },[])

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 to-white'>
      

      
    </div>
  )
}

export default Discover