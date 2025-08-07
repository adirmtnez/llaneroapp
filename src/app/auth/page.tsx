'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StoreIcon } from "lucide-react"
import { LoginForm } from "@/components/login-form"
import { RegisterForm } from "@/components/register-form"
import { Button } from "@/components/ui/button"
import { useAuth } from '@/contexts/auth-context'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const router = useRouter()
  const { user } = useAuth()

  // Redirect if already authenticated with admin/manager role
  useEffect(() => {
    if (user && user.role && (user.role.id === 1 || user.role.id === 2)) {
      router.push('/admin')
    }
  }, [user, router])

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        {/* Logo en desktop - arriba izquierda */}
        <div className="hidden md:flex justify-start">
          <a href="/" className="flex items-center">
            <img 
              src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/Llanero%20Logo.png"
              alt="LlaneroBodegón"
              className="w-[120px] h-auto"
            />
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            {/* Logo en mobile - encima de tabs */}
            <div className="flex md:hidden justify-center mb-8">
              <a href="/" className="flex items-center">
                <img 
                  src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/Llanero%20Logo.png"
                  alt="LlaneroBodegón"
                  className="w-[120px] h-auto"
                />
              </a>
            </div>
            <div className="flex mb-6 bg-muted rounded-lg p-1">
              <Button
                variant={isLogin ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsLogin(true)}
                className="flex-1 rounded-md h-10 md:h-8 text-base md:text-sm"
              >
                Iniciar Sesión
              </Button>
              <Button
                variant={!isLogin ? "default" : "ghost"}
                size="sm"
                onClick={() => setIsLogin(false)}
                className="flex-1 rounded-md h-10 md:h-8 text-base md:text-sm"
              >
                Registrarse
              </Button>
            </div>
            {isLogin ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>
      </div>
      <div className="relative hidden lg:block">
        <img
          src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/img_03.png"
          alt="Background"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  )
}