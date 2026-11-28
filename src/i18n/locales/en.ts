// Lớp 1 – Ngôn ngữ giao diện (UI Language) – English
import type { Translations } from "./vi";

const en: Translations = {
    // ==================== HEADER ====================
    header: {
        logo: "ATA GAMES",
        nav: {
            home: "Home",
            store: "Store",
            library: "Library",
            community: "Community",
            support: "Support",
        },
        support: {
            purchaseGuide: "Purchase Guide",
            policies: "Policies & Terms",
        },
        search: {
            placeholder: "Search...",
            ariaLabel: "Search games",
            clearLabel: "Clear search keyword",
            history: "Search History",
            clearAll: "Clear all",
            viewAll: (count: number, keyword: string) =>
                `View all ${count} results for "${keyword}"`,
            noResult: (keyword: string) =>
                `No games found for "${keyword}"`,
            loading: "Loading games...",
            free: "Free",
        },
        cart: {
            ariaLabel: (count: number) => `Cart (${count} items)`,
        },
        notifications: {
            ariaLabel: (count: number) => `Notifications (${count} unread)`,
            title: "Notifications",
            unread: (count: number) => `${count} unread`,
            markAllRead: "Mark all read",
            empty: "No new events.",
            loginPrompt: "Log in to see your notifications.",
            loadError: "Could not load notifications.",
        },
        account: {
            ariaLabel: (name: string) => `${name}'s account`,
            profile: "My Profile",
            vouchers: "My Vouchers",
            orders: "Order History",
            favorites: "Favorites",
            logout: "Sign out",
            logoutError: "Could not sign out. Please try again.",
            login: "Sign in",
        },
        nav_aria: "Main navigation",
        regionSettings: "Region Settings",
        language: "Language",
        currency: "Currency",
    },

    // ==================== NOTIFICATION MESSAGES ====================
    notifications: {
        orderCompleted: "Purchase successful",
        orderRefunded: "Order refunded",
        orderRefundedMsg: (titles: string) =>
            `Your order for ${titles} has been refunded.`,
        orderCompletedMsg: (titles: string) =>
            `You have purchased ${titles}.`,
        newReply: "New reply in Community",
        newReplyMsg: (userName: string, postTitle: string) =>
            `${userName} replied to your post "${postTitle}".`,
        voucherReceived: "You received a voucher",
        voucherReceivedMsg: (prizeName: string, code: string) =>
            `You received ${prizeName} with code ${code}.`,
    },

    // ==================== TIME ====================
    time: {
        justNow: "Just now",
        minutesAgo: (n: number) => `${n} minute${n !== 1 ? "s" : ""} ago`,
        hoursAgo: (n: number) => `${n} hour${n !== 1 ? "s" : ""} ago`,
        daysAgo: (n: number) => `${n} day${n !== 1 ? "s" : ""} ago`,
    },

    // ==================== HOME ====================
    home: {
        featuredGames: "Featured Games",
        newReleases: "New Releases",
        bestSellers: "Best Sellers",
        viewAll: "View all",
        free: "Free",
        discount: (pct: number) => `-${pct}%`,
        addToCart: "Add to Cart",
        buyNow: "Buy Now",
        onSale: "On Sale",
    },

    // ==================== STORE ====================
    store: {
        title: "Store",
        searchResults: (keyword: string) => `Results for "${keyword}"`,
        noResults: "No matching games found.",
        filters: {
            genre: "Genre",
            platform: "Platform",
            price: "Price",
            all: "All",
            free: "Free",
            paid: "Paid",
            sort: "Sort",
            sortOptions: {
                newest: "Newest",
                priceAsc: "Price: Low to High",
                priceDesc: "Price: High to Low",
                rating: "Highest Rated",
                name: "Name A–Z",
            },
        },
        pagination: {
            prev: "Previous",
            next: "Next",
            page: (current: number, total: number) =>
                `Page ${current} of ${total}`,
        },
        free: "Free",
    },

    // ==================== GAME DETAIL ====================
    gameDetail: {
        addToCart: "Add to Cart",
        buyNow: "Buy Now",
        alreadyOwned: "You already own this game",
        inCart: "Already in cart",
        free: "Free",
        description: "Description",
        systemRequirements: "Minimum Requirements",
        genre: "Genre",
        developer: "Developer",
        publisher: "Publisher",
        releaseDate: "Release Date",
        platform: "Platform",
        rating: "Rating",
        reviews: "Reviews",
        promotions: "Promotions",
    },

    // ==================== CART ====================
    cart: {
        title: "Shopping Cart",
        empty: "Your cart is empty.",
        continueShopping: "Continue Shopping",
        total: "Total",
        checkout: "Checkout",
        remove: "Remove",
        quantity: "Quantity",
        subtotal: "Subtotal",
        discount: "Discount",
        voucher: "Voucher Code",
        applyVoucher: "Apply",
        voucherApplied: "Voucher applied",
        invalidVoucher: "Invalid voucher code",
    },

    // ==================== CHECKOUT ====================
    checkout: {
        title: "Checkout",
        orderSummary: "Order Summary",
        paymentMethod: "Payment Method",
        placeOrder: "Place Order",
        success: "Order placed!",
        successMsg: "Thank you for your purchase. Your order is being processed.",
        total: "Total",
        back: "Back to Cart",
    },

    // ==================== PROFILE ====================
    profile: {
        title: "My Profile",
        name: "Name",
        email: "Email",
        avatar: "Avatar",
        changeAvatar: "Change Avatar",
        save: "Save Changes",
        saved: "Saved!",
        changePassword: "Change Password",
        currentPassword: "Current Password",
        newPassword: "New Password",
        confirmPassword: "Confirm Password",
        passwordMismatch: "Passwords do not match.",
        passwordChanged: "Password changed successfully.",
        joinedAt: "Joined",
    },

    // ==================== FAVORITES ====================
    favorites: {
        title: "Favorite Games",
        empty: "You have no favorite games yet.",
        remove: "Remove from Favorites",
        addToCart: "Add to Cart",
    },

    // ==================== ORDERS ====================
    orders: {
        title: "Order History",
        empty: "You have no orders yet.",
        orderId: "Order ID",
        date: "Date",
        total: "Total",
        status: {
            completed: "Completed",
            pending: "Pending",
            refunded: "Refunded",
            cancelled: "Cancelled",
        },
        viewDetail: "View Details",
        refund: "Request Refund",
    },

    // ==================== VOUCHERS ====================
    vouchers: {
        title: "My Vouchers",
        empty: "You have no vouchers yet.",
        code: "Code",
        discount: "Discount",
        expiry: "Expires",
        copy: "Copy",
        copied: "Copied!",
        used: "Used",
        expired: "Expired",
    },

    // ==================== AUTH ====================
    auth: {
        login: "Sign In",
        register: "Sign Up",
        email: "Email",
        password: "Password",
        name: "Display Name",
        forgotPassword: "Forgot password?",
        noAccount: "Don't have an account?",
        hasAccount: "Already have an account?",
        loginSuccess: "Signed in successfully!",
        registerSuccess: "Account created!",
        invalidCredentials: "Invalid email or password.",
        emailTaken: "Email is already in use.",
        required: "Please fill in all fields.",
        logout: "Sign Out",
    },

    // ==================== LIBRARY ====================
    library: {
        title: "Game Library",
        empty: "You don't own any games yet. Start shopping!",
        play: "Play Now",
        viewStore: "Browse Store",
    },

    // ==================== COMMUNITY ====================
    community: {
        title: "Community",
        newPost: "New Post",
        reply: "Reply",
        replies: (n: number) => `${n} ${n !== 1 ? "replies" : "reply"}`,
        empty: "No posts yet.",
        postPlaceholder: "Write your post...",
        replyPlaceholder: "Write a reply...",
        submit: "Post",
        cancel: "Cancel",
        delete: "Delete",
        by: "by",
    },

    // ==================== LUCKY WHEEL ====================
    luckyWheel: {
        title: "Lucky Wheel",
        spin: "Spin Now",
        spinning: "Spinning...",
        result: "You received",
        history: "Spin History",
        noHistory: "No spin history yet.",
        spinsLeft: (n: number) => `${n} spin${n !== 1 ? "s" : ""} left`,
    },

    // ==================== FOOTER ====================
    footer: {
        about: "About Us",
        contact: "Contact",
        policies: "Policies",
        terms: "Terms",
        copyright: (year: number) => `© ${year} ATA Games. All rights reserved.`,
        followUs: "Follow Us",
    },

    // ==================== COMMON ====================
    common: {
        loading: "Loading...",
        error: "An error occurred. Please try again.",
        retry: "Retry",
        close: "Close",
        confirm: "Confirm",
        cancel: "Cancel",
        save: "Save",
        edit: "Edit",
        delete: "Delete",
        back: "Back",
        next: "Next",
        previous: "Previous",
        search: "Search",
        filter: "Filter",
        sort: "Sort",
        viewAll: "View all",
        free: "Free",
        from: "from",
        or: "or",
        and: "and",
        yes: "Yes",
        no: "No",
        ok: "OK",
        notFound: "Page not found.",
        backHome: "Back to Home",
    },

    // ==================== SUPPORT ====================
    support: {
        purchaseGuide: {
            title: "Purchase Guide",
        },
        policies: {
            title: "Policies & Terms",
        },
        popup: {
            title: "Customer Support",
            placeholder: "Type your question...",
            send: "Send",
        },
    },
};

export default en;
