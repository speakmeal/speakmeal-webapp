import React from 'react'

function Footer() {
  return (
    <div className="bg-purple-600 flex flex-row justify-around items-center p-5 h-16">
        <div className='text-white'>
            © 2024 Speak Meal. All Rights Reserved
        </div>

        <div className='space-x-4 text-white'>
            <a>Privacy Policy</a>
            <a>Terms of Service</a>
            <a>FAQ</a>
        </div>

    </div>
  )
}

export default Footer