import Link from 'next/link';

export default function NotFound() {
  return (
   <div>
    <div className="h-screen w-screen bg-gray-100 flex items-center">
    <div className="container flex flex-col md:flex-row items-center justify-center px-5 text-gray-700">
        <div className='max-w-md'>
            <div className='text-5xl font-dark'>404</div>
            <p className='text-2xl md:text-3xl font-light'>Página não encontrada</p>
            <p className='mt-4 mb-8'>Oops! A página que você está procurando não existe.</p>
            <Link href="/" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full">
                Voltar para a página inicial
            </Link>
        </div>
    </div>
    </div>
   </div>

  );
} 