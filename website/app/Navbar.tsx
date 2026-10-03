export default function Navbar() { 


  return (<header className="flex justify-center px-100 py-2">
    <nav className="block w-full">
        <ul className="flex justify-between">
          <li><a href="/">Website name or logo</a></li>
          <li><a href="/map">Map</a></li>
          <li><a href="/reports">Reports</a></li>
        </ul>
      </nav>
  </header>)
};