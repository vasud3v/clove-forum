/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
				mono: ['Space Mono', 'Fira Code', 'monospace'],
				display: ['Space Grotesk', 'system-ui', 'sans-serif'],
			},
			zIndex: {
				'header': '1000',
				'dropdown': '1100',
				'modal': '1200',
				'mobile-nav': '900',
				'toast': '1300',
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				// Neo-Brutalism semantic colors
				'brutal-red': '#FF3B3B',
				'brutal-yellow': '#FFD93D',
				'brutal-blue': '#3B82F6',
				'brutal-green': '#22C55E',
				'brutal-orange': '#FF8C00',
				'brutal-purple': '#8B5CF6',
				'brutal-pink': '#EC4899',
				'brutal-cyan': '#06B6D4',
				// Forum semantic aliases (backwards-compat for feature files)
				'forum-bg': 'hsl(var(--background))',
				'forum-card': 'hsl(var(--card))',
				'forum-card-alt': 'hsl(var(--muted))',
				'forum-text': 'hsl(var(--foreground))',
				'forum-muted': 'hsl(var(--muted-foreground))',
				'forum-border': 'hsl(var(--border))',
				'forum-accent': 'hsl(var(--accent))',
				'forum-pink': 'hsl(var(--primary))',
				'forum-hover': 'hsl(var(--muted))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				success: {
					DEFAULT: '#22C55E',
					foreground: '#000000',
				}
			},
			borderRadius: {
				lg: '4px',
				md: '2px',
				sm: '0px'
			},
			boxShadow: {
				'brutal': '4px 4px 0px 0px #000000',
				'brutal-sm': '2px 2px 0px 0px #000000',
				'brutal-md': '4px 4px 0px 0px #000000',
				'brutal-lg': '6px 6px 0px 0px #000000',
				'brutal-xl': '8px 8px 0px 0px #000000',
				'brutal-hover': '6px 6px 0px 0px #000000',
				'brutal-active': '2px 2px 0px 0px #000000',
				'brutal-white': '4px 4px 0px 0px #FFFFFF',
				'brutal-white-lg': '6px 6px 0px 0px #FFFFFF',
				'none': 'none',
			},
			borderWidth: {
				'3': '3px',
				'4': '4px',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'brutal-bounce': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-4px)' }
				},
				'brutal-shake': {
					'0%, 100%': { transform: 'translateX(0)' },
					'25%': { transform: 'translateX(-2px)' },
					'75%': { transform: 'translateX(2px)' }
				},
				'brutal-press': {
					'0%': { transform: 'translate(0, 0)', boxShadow: '4px 4px 0px 0px #000' },
					'100%': { transform: 'translate(2px, 2px)', boxShadow: '2px 2px 0px 0px #000' }
				},
				'stripe-move': {
					'0%': { backgroundPosition: '0 0' },
					'100%': { backgroundPosition: '40px 0' }
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'slide-in-left': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'slide-in-up': {
					'0%': { transform: 'translateY(8px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'pop-in': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.15s ease-out',
				'accordion-up': 'accordion-up 0.15s ease-out',
				'brutal-bounce': 'brutal-bounce 0.4s ease-in-out',
				'brutal-shake': 'brutal-shake 0.3s ease-in-out',
				'brutal-press': 'brutal-press 0.1s ease-in-out forwards',
				'stripe-move': 'stripe-move 1s linear infinite',
				'slide-in-right': 'slide-in-right 0.2s ease-out',
				'slide-in-left': 'slide-in-left 0.2s ease-out',
				'slide-in-up': 'slide-in-up 0.15s ease-out',
				'pop-in': 'pop-in 0.15s ease-out',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}