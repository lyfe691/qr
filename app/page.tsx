import { Header } from "@/components/header"
import { QRGeneratorLoader } from "@/components/qr-generator-loader"

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <QRGeneratorLoader />
      </main>
    </div>
  )
}
