declare global {
    type SignInFormData = {
        email: string;
        password: string;
    };

    type SignUpFormData = {
        fullName: string;
        email: string;
        password: string;
        country: string;
        investmentGoals: string;
        riskTolerance: string;
        preferredIndustry: string;
    };

    type CountrySelectProps = {
        name: string;
        label: string;
        control: Control;
        error?: FieldError;
        required?: boolean;
    };

    type FormInputProps = {
        name: string;
        label: string;
        placeholder: string;
        type?: string;
        register: UseFormRegister;
        error?: FieldError;
        validation?: RegisterOptions;
        disabled?: boolean;
        value?: string;
    };

    type Option = {
        value: string;
        label: string;
    };

    type SelectFieldProps = {
        name: string;
        label: string;
        placeholder: string;
        options: readonly Option[];
        control: Control;
        error?: FieldError;
        required?: boolean;
    };

    type FooterLinkProps = {
        text: string;
        linkText: string;
        href: string;
    };

    type SearchCommandProps = {
        renderAs?: 'button' | 'text';
        label?: string;
        initialStocks: StockWithWatchlistStatus[];
    };

    type WelcomeEmailData = {
        email: string;
        name: string;
        intro: string;
    };

    type User = {
        id: string;
        name: string;
        email: string;
    };

    type Stock = {
        symbol: string;
        name: string;
        exchange: string;
        type: string;
    };

    type StockWithWatchlistStatus = Stock & {
        isInWatchlist: boolean;
    };

    type FinnhubSearchResult = {
        symbol: string;
        description: string;
        displaySymbol?: string;
        type: string;
    };

    type FinnhubSearchResponse = {
        count: number;
        result: FinnhubSearchResult[];
    };

    type StockDetailsPageProps = {
        params: Promise<{
            symbol: string;
        }>;
    };

    type WatchlistButtonProps = {
        symbol: string;
        company: string;
        isInWatchlist: boolean;
        showTrashIcon?: boolean;
        type?: 'button' | 'icon';
        onWatchlistChange?: (symbol: string, isAdded: boolean) => void;
    };

    type QuoteData = {
        c?: number;
        dp?: number;
    };

    type ProfileData = {
        name?: string;
        marketCapitalization?: number;
    };

    type FinancialsData = {
        metric?: { [key: string]: number };
    };

    type SelectedStock = {
        symbol: string;
        company: string;
        currentPrice?: number;
    };

    type WatchlistTableProps = {
        watchlist: StockWithData[];
    };

    type StockWithData = {
        userId: string;
        symbol: string;
        company: string;
        addedAt: Date;
        currentPrice?: number;
        changePercent?: number;
        priceFormatted?: string;
        changeFormatted?: string;
        marketCap?: string;
        peRatio?: string;
    };

    type AlertsListProps = {
        alertData: Alert[] | undefined;
    };

    type MarketNewsArticle = {
        id: number;
        headline: string;
        summary: string;
        source: string;
        url: string;
        datetime: number;
        category: string;
        related: string;
        image?: string;
    };

    type WatchlistNewsProps = {
        news?: MarketNewsArticle[];
    };

    type SearchCommandProps = {
        open?: boolean;
        setOpen?: (open: boolean) => void;
        renderAs?: 'button' | 'text';
        buttonLabel?: string;
        buttonVariant?: 'primary' | 'secondary';
        className?: string;
    };

    type AlertData = {
        symbol: string;
        company: string;
        alertName: string;
        alertType: 'upper' | 'lower';
        threshold: string;
    };

    type AlertModalProps = {
        alertId?: string;
        alertData?: AlertData;
        action?: string;
        open: boolean;
        setOpen: (open: boolean) => void;
    };

    type RawNewsArticle = {
        id: number;
        headline?: string;
        summary?: string;
        source?: string;
        url?: string;
        datetime?: number;
        image?: string;
        category?: string;
        related?: string;
    };

    type Alert = {
        id: string;
        symbol: string;
        company: string;
        alertName: string;
        currentPrice: number;
        alertType: 'upper' | 'lower';
        threshold: number;
        changePercent?: number;
    };

    // Tushare API Types
    type TushareResponse = {
        code: number;
        msg: string | null;
        data: {
            fields: string[];
            items: any[][];
        };
    };

    type TushareStockBasic = {
        ts_code: string; // Stock code with exchange (e.g., '000001.SZ')
        symbol: string; // Stock code without exchange (e.g., '000001')
        name: string; // Stock name in Chinese
        area: string; // Region/Province
        industry: string; // Industry
        market: string; // Market (主板/中小板/创业板)
        list_date: string; // Listing date (YYYYMMDD)
        list_status?: string; // Listing status (L: Listed, D: Delisted, P: Paused)
        is_hs?: string; // Is in HS connect (H: HK to SH, S: HK to SZ)
    };

    type TushareQuoteData = {
        close: number; // Closing price
        pct_chg: number; // Percentage change
        vol?: number; // Volume (in lots of 100 shares)
        amount?: number; // Trading amount (in thousands)
    };

    type TushareCompanyInfo = {
        ts_code: string;
        chairman?: string; // Chairman
        manager?: string; // General Manager
        secretary?: string; // Secretary
        reg_capital?: number; // Registered capital
        setup_date?: string; // Establishment date
        province?: string; // Province
        city?: string; // City
        introduction?: string; // Company introduction
        website?: string; // Company website
        email?: string; // Contact email
        office?: string; // Office address
        employees?: number; // Number of employees
        main_business?: string; // Main business
        business_scope?: string; // Business scope
    };

    type TushareDailyData = {
        ts_code: string;
        trade_date: string; // Trading date (YYYYMMDD)
        open: number; // Opening price
        high: number; // Highest price
        low: number; // Lowest price
        close: number; // Closing price
        pre_close: number; // Previous close
        change: number; // Price change
        pct_chg: number; // Percentage change
        vol: number; // Volume
        amount: number; // Trading amount
    };
}

export {};