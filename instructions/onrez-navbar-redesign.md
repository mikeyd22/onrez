# OnRez — Navbar Redesign: Transparent + Frosted Glass Pill

## Overview

Redesign the navbar to be transparent with a frosted glass pill-shaped nav group in the center. This replaces the current solid light blue navbar.

---

## New Navbar Design

```
[OR Logo + OnRez]          ( Home    Map    Explore )          [M] Michael Da ▾
     left side              center frosted pill                   right side
```

### Layout

- **Full-width, sticky, transparent background** — no solid color, the page content shows through behind it
- **Left:** OnRez logo (blue rounded square with "OR") + "OnRez" text. On the hero page, logo text should be **white**. On light background pages, it should be **dark**.
- **Center:** Nav links (Home, Map, Explore) grouped inside a **frosted glass pill** — semi-transparent background with backdrop blur, fully rounded (`rounded-full`)
- **Right:** User avatar circle + name + dropdown chevron (when logged in) OR "Log in" + "Sign up" button (when logged out)
- **No bottom border or shadow on the navbar itself** — the frosted pill provides the visual separation

### Frosted Glass Pill Spec

```tsx
<nav className="bg-white/70 backdrop-blur-md rounded-full px-2 py-1.5 shadow-sm border border-white/50">
  <div className="flex items-center gap-1">
    <NavLink href="/" icon={Home}>Home</NavLink>
    <NavLink href="/map" icon={Map}>Map</NavLink>
    <NavLink href="/explore" icon={Compass}>Explore</NavLink>
  </div>
</nav>
```

**Each nav link inside the pill:**
```tsx
<Link
  href={href}
  className={cn(
    "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
    isActive
      ? "bg-white text-gray-900 shadow-sm"          // Active: solid white pill inside the pill
      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"  // Inactive: subtle hover
  )}
>
  <Icon className="w-4 h-4" />
  {label}
</Link>
```

**Key details:**
- The pill has `bg-white/70` (70% white) + `backdrop-blur-md` for the frosted glass effect
- Active page link gets its own inner solid white pill (`bg-white shadow-sm`) — this creates a "selected tab" feel
- Inactive links are semi-transparent, darken on hover
- The whole pill has a very subtle border (`border-white/50`) and light shadow
- Icons (Lucide: Home, Map, Compass) are small (w-4 h-4) next to the text

### Full Navbar Container

```tsx
<header className="fixed top-0 left-0 right-0 z-50 px-6 py-3">
  <div className="max-w-7xl mx-auto flex items-center justify-between">
    {/* Left — Logo */}
    <Link href="/" className="flex items-center gap-2.5">
      <div className="w-9 h-9 bg-primary-blue rounded-lg flex items-center justify-center">
        <span className="text-white text-sm font-bold">OR</span>
      </div>
      <span className="text-lg font-semibold text-gray-900">OnRez</span>
    </Link>

    {/* Center — Frosted pill nav */}
    <nav className="bg-white/70 backdrop-blur-md rounded-full px-2 py-1.5 shadow-sm border border-white/50">
      <div className="flex items-center gap-1">
        {/* Nav links with active state */}
      </div>
    </nav>

    {/* Right — Auth / User menu */}
    <div className="flex items-center gap-3">
      {user ? (
        <UserMenu user={user} profile={profile} />
      ) : (
        <>
          <Link href="/auth/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            Log in
          </Link>
          <Link href="/auth/signup" className="bg-primary-blue text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-blue-700 transition-colors">
            Sign up
          </Link>
        </>
      )}
    </div>
  </div>
</header>
```

**Important:** Since the navbar is now `fixed` and transparent, add `pt-[72px]` (or whatever the navbar height is) to the page content wrapper so content doesn't hide behind the navbar. **EXCEPT** on the Home page where the hero image should extend behind/under the navbar — that's the whole point of making it transparent.

### Page-Specific Adjustments

**Home page (`/`):**
- Hero section should have `pt-0` or negative margin so the image extends behind the navbar
- The frosted pill still works on top of the dark hero image because of the blur + semi-transparent white
- Logo text color: can stay dark since the frosted pill provides contrast, OR make it white on the home hero and dark elsewhere

**Map page (`/map`):**
- Map already fills the viewport — navbar floats on top of the map
- Frosted pill works great here on top of map tiles

**Explore page and other pages (`/explore`, `/university/*`, `/listing/*`):**
- These have white/light gray backgrounds
- The frosted pill will appear as a subtle glass bar on the light background — still visible due to the border and shadow
- Looks clean and consistent

### Mobile Navbar

On mobile (below `md` breakpoint):
- Logo on the left
- Hamburger menu icon on the right
- Tapping hamburger opens a full-width dropdown panel (also frosted glass) with the nav links stacked vertically
- User menu items go below the nav links in the dropdown

```tsx
{/* Mobile menu button */}
<button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
  <Menu className="w-6 h-6 text-gray-700" />
</button>

{/* Mobile dropdown */}
{mobileOpen && (
  <div className="md:hidden absolute top-full left-4 right-4 mt-2 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/50 p-4">
    <nav className="flex flex-col gap-2">
      <MobileNavLink href="/">Home</MobileNavLink>
      <MobileNavLink href="/map">Map</MobileNavLink>
      <MobileNavLink href="/explore">Explore</MobileNavLink>
    </nav>
    <hr className="my-3 border-gray-200" />
    {/* Auth links or user menu */}
  </div>
)}
```

### User Menu (Logged In)

The user section on the right should also have a frosted glass dropdown:

```tsx
<div className="relative">
  <button
    onClick={() => setMenuOpen(!menuOpen)}
    className="flex items-center gap-2 bg-white/70 backdrop-blur-md rounded-full pl-1.5 pr-3 py-1.5 shadow-sm border border-white/50 hover:bg-white/90 transition-colors"
  >
    {/* Avatar circle */}
    <div className="w-7 h-7 rounded-full bg-primary-blue flex items-center justify-center">
      <span className="text-white text-xs font-bold">{initials}</span>
    </div>
    <span className="text-sm font-medium text-gray-700">{profile.display_name}</span>
    <ChevronDown className="w-4 h-4 text-gray-400" />
  </button>

  {/* Dropdown */}
  {menuOpen && (
    <div className="absolute right-0 top-full mt-2 w-56 bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/50 py-2">
      <DropdownLink href="/bookmarks">My Bookmarks</DropdownLink>
      <DropdownLink href="/my-listings">My Listings</DropdownLink>
      <DropdownLink href="/listing/new">Post a Listing</DropdownLink>
      <hr className="my-2 border-gray-200" />
      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
        Log Out
      </button>
    </div>
  )}
</div>
```

The user button itself is also a small frosted pill, matching the center nav pill style. This creates visual consistency — the navbar has three elements (logo, nav pill, user pill) that feel cohesive.

---

## Sign Up Button (Logged Out)

When the user is not logged in, the "Sign up" button should also be `rounded-full` to match the pill aesthetic:

```tsx
<Link href="/auth/signup" className="bg-primary-blue text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-blue-700 transition-colors">
  Sign up
</Link>
```

---

## Summary

| Element | Style |
|---------|-------|
| Navbar container | `fixed`, transparent, no background color, `z-50` |
| Center nav group | Frosted glass pill: `bg-white/70 backdrop-blur-md rounded-full` |
| Active nav link | Solid white inner pill: `bg-white shadow-sm rounded-full` |
| Inactive nav link | `text-gray-600 hover:bg-white/50 rounded-full` |
| User menu button | Small frosted pill matching center nav style |
| All dropdowns | Frosted glass: `bg-white/80 backdrop-blur-lg rounded-xl` |
| Mobile menu | Full-width frosted dropdown panel |
| Page content | Add top padding to account for fixed navbar (except Home hero) |
