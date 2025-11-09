export default function Navbar({ className = "" }) {
  return (
    <div className={`${className} z-50`}>
      <nav className="w-full">
        <ul className="font-medium flex justify-center gap-4 p-4 border border-black rounded-lg bg-gray-50 dark:bg-black">
          <li>
            <a
              onClick={() => {
                window.open("https://docs.simli.com/introduction");
              }}
              className="block cursor-pointer py-2 px-3 text-gray-900 dark:text-white hover:underline"
            >
              Documentation
            </a>
          </li>
          <li>
            <a
              onClick={() => {
                window.open("https://simli.com");
              }}
              className="block cursor-pointer py-2 px-3 text-gray-900 dark:text-white hover:underline"
            >
              Billing
            </a>
          </li>
          <li>
            <a
              onClick={() => {
                window.open("https://discord.gg/yQx49zNF4d");
              }}
              className="block cursor-pointer py-2 px-3 text-gray-900 dark:text-white hover:underline"
            >
              Discord
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}