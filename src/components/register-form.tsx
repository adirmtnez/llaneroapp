import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { signUp } = useAuth()
  const router = useRouter()

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { score: 0, label: "" }
    if (pwd.length < 6) return { score: 1, label: "Muy débil" }
    
    let score = 0
    if (pwd.length >= 8) score++
    if (/[a-z]/.test(pwd)) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/\d/.test(pwd)) score++
    if (/[^a-zA-Z\d]/.test(pwd)) score++

    if (score <= 1) return { score: 1, label: "Muy débil" }
    if (score === 2) return { score: 2, label: "Débil" }
    if (score === 3) return { score: 3, label: "Media" }
    if (score === 4) return { score: 4, label: "Fuerte" }
    return { score: 5, label: "Muy fuerte" }
  }

  const strength = getPasswordStrength(password)

  const getStrengthColor = (score: number) => {
    if (score === 0) return "bg-gray-300"
    if (score === 1) return "bg-red-500"
    if (score === 2) return "bg-orange-500"
    if (score === 3) return "bg-yellow-500"
    if (score === 4) return "bg-lime-500"
    return "bg-green-500"
  }

  const getStrengthWidth = (score: number) => {
    return `${(score / 5) * 100}%`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const { error: signUpError } = await signUp({ 
      name, 
      email, 
      password 
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
    } else {
      setSuccess('¡Cuenta creada exitosamente! Revisa tu correo para verificar tu cuenta.')
      setLoading(false)
      // Optionally redirect to login or admin after verification
    }
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Crear cuenta</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Completa la información para crear tu cuenta
        </p>
      </div>
      
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
          {success}
        </div>
      )}
      
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="name">Nombre completo</Label>
          <Input 
            id="name" 
            placeholder="Juan Pérez" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 md:h-9 text-base md:text-sm"
            required 
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="juan@ejemplo.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 md:h-9 text-base md:text-sm"
            required 
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input 
              id="password" 
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10 h-10 md:h-9 text-base md:text-sm"
              required 
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {password.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fuerza de contraseña:</span>
                <span className={cn(
                  "font-medium",
                  strength.score === 1 && "text-red-500",
                  strength.score === 2 && "text-orange-500", 
                  strength.score === 3 && "text-yellow-600",
                  strength.score === 4 && "text-lime-600",
                  strength.score === 5 && "text-green-600"
                )}>
                  {strength.label}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    getStrengthColor(strength.score)
                  )}
                  style={{ width: getStrengthWidth(strength.score) }}
                />
              </div>
            </div>
          )}
        </div>
        <Button type="submit" className="w-full h-11 md:h-10 text-base md:text-sm" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>
        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            O continúa con
          </span>
        </div>
        <Button variant="outline" className="w-full h-11 md:h-10 text-base md:text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Registrarse con Google
        </Button>
      </div>
      <div className="text-center text-xs text-muted-foreground">
        Al continuar, aceptas automáticamente nuestras{" "}
        <a href="#" className="underline underline-offset-4 hover:text-foreground">
          Política de privacidad
        </a>{" "}
        y{" "}
        <a href="#" className="underline underline-offset-4 hover:text-foreground">
          Políticas de cookies
        </a>
      </div>
    </form>
  )
}