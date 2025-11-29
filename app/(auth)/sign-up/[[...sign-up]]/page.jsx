import { SignIn, SignUp, SignUpButton } from '@clerk/nextjs'

export default function Page() {
  return (
    <section className="bg-white">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-12">
        <section className="relative flex h-32 items-end bg-gray-900 lg:col-span-5 lg:h-full xl:col-span-6">
          <img alt="ERROR LOADING IMAGES"
            src="aa.jpg"
            className="absolute inset-0 h-full w-full object-cover opacity-80" />

          <div className="hidden lg:relative lg:block lg:p-12">
            <a className="block text-white" href="#">
              <span className="sr-only">Home</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 64 64"
                className="h-8 sm:h-10 text-white"
                fill="currentColor"
              >
                {/* Half-circle (sun) */}
                <path d="M32 6C18.7 6 8 16.7 8 30h48C56 16.7 45.3 6 32 6z" />

                {/* Waves */}
                <path d="M8 38c4 3 8 3 12 0s8-3 12 0 8 3 12 0 8-3 12 0v4c-4-3-8-3-12 0s-8 3-12 0-8-3-12 0-8 3-12 0v-4z" />
                <path d="M8 46c4 3 8 3 12 0s8-3 12 0 8 3 12 0 8-3 12 0v4c-4-3-8-3-12 0s-8 3-12 0-8-3-12 0-8 3-12 0v-4z" />
                <path d="M8 54c4 3 8 3 12 0s8-3 12 0 8 3 12 0 8-3 12 0v4c-4-3-8-3-12 0s-8 3-12 0-8-3-12 0-8 3-12 0v-4z" />
              </svg>

            </a>
            <h1 className="mt-6 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              Welcome to intervuAI
            </h1>
            <p className="mt-4 leading-relaxed text-white/90">
              Practice Interview with AI
            </p>
          </div>
        </section>
        <main
          className="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6">
          <div className="max-w-xl lg:max-w-3xl">
            <div className="relative -mt-16 block lg:hidden">
              <a className="inline-flex size-16 items-center justify-center rounded-full bg-white text-blue-600"
                href="#">
                <span className="sr-only">Home</span>
                <svg className="h-8 sm:h-10" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M0.41 10.3847C1.4194 2.285643 4.7861 5.2639 2.90424C7.6714 1.02234 10.6393 0 12.695 0C16.7507 0 19.7186"
                    fill="currentColor" />
                </svg>

              </a>
              <h2 className="mt-6 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                Welcome
              </h2>
              <p className="mt-4 leading-relaxed text-white/90">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis nec velit nec metus.
              </p>
            </div>
            <SignUp 
            routing="path"
        signInUrl="/sign-in"
        afterSignUpUrl="/dashboard"
            />
          </div>
        </main>
      </div>
    </section>
  )
}

