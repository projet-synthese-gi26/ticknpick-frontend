interface FormCardProps {
    title: string
    subtitle?: string
    children: React.ReactNode
  }
  
  export default function FormCard({ title, subtitle, children }: FormCardProps) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            {subtitle && (
              <p className="text-blue-100 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    )
  }