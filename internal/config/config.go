package config

import (
	"fmt"
	"net"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	SupplyEnabled  bool
	ListenAddr     string
	LANListenAddr  string
	PublicURL      string
	AdminUsername  string
	AdminPassword  string
	APIKeys        []string
	AuthDisabled   bool
	DatabasePath   string
	MasterKeyPath  string
	MasterKey      string
	CatalogPath    string
	RequestTimeout time.Duration
	MaxBodyBytes   int64
	LogPrompts     bool
	RateLimitRPM   int
	Concurrency    int
}

func Load() (Config, error) {
	adminPassword := secretOrEnv("OPENSCALER_ADMIN_PASSWORD")
	if adminPassword == "" {
		// Keep existing installations working while they migrate their secret file.
		adminPassword = secretOrEnv("OPENSCALER_MANAGEMENT_TOKEN")
	}
	apiKeys := splitCSV(secretOrEnv("OPENSCALER_API_KEYS"))
	cfg := Config{
		ListenAddr:     env("OPENSCALER_LISTEN_ADDR", ":8080"),
		LANListenAddr:  strings.TrimSpace(os.Getenv("OPENSCALER_LAN_LISTEN_ADDR")),
		PublicURL:      strings.TrimRight(env("OPENSCALER_PUBLIC_URL", ""), "/"),
		AdminUsername:  env("OPENSCALER_ADMIN_USERNAME", "admin"),
		AdminPassword:  adminPassword,
		APIKeys:        apiKeys,
		DatabasePath:   env("OPENSCALER_DATABASE_PATH", "/data/openscaler.db"),
		MasterKeyPath:  env("OPENSCALER_MASTER_KEY_PATH", "/data/keys/master.key"),
		MasterKey:      secretOrEnv("OPENSCALER_MASTER_KEY"),
		CatalogPath:    env("OPENSCALER_CATALOG_PATH", "/etc/openscaler/catalog.yaml"),
		RequestTimeout: 120 * time.Second,
		MaxBodyBytes:   8 << 20,
		RateLimitRPM:   60,
		Concurrency:    8,
	}
	if cfg.PublicURL != "" {
		parsed, parseErr := url.Parse(cfg.PublicURL)
		if parseErr != nil || parsed.Host == "" || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.RawQuery != "" || parsed.Fragment != "" {
			return Config{}, fmt.Errorf("OPENSCALER_PUBLIC_URL must be an http or https origin")
		}
	}
	if cfg.LANListenAddr != "" {
		host, port, splitErr := net.SplitHostPort(cfg.LANListenAddr)
		ip := net.ParseIP(strings.Trim(host, "[]"))
		if splitErr != nil || port == "" || ip == nil || ip.IsLoopback() || ip.IsUnspecified() {
			return Config{}, fmt.Errorf("OPENSCALER_LAN_LISTEN_ADDR must use one specific non-loopback IP and port")
		}
	}
	var err error
	if cfg.SupplyEnabled, err = parseBool("OPENSCALER_SUPPLY_ENABLED", false); err != nil {
		return Config{}, err
	}
	if cfg.AuthDisabled, err = parseBool("OPENSCALER_AUTH_DISABLED", false); err != nil {
		return Config{}, err
	}
	if cfg.LogPrompts, err = parseBool("OPENSCALER_LOG_PROMPTS", false); err != nil {
		return Config{}, err
	}
	if seconds, err := strconv.Atoi(env("OPENSCALER_REQUEST_TIMEOUT_SECONDS", "120")); err != nil || seconds < 1 {
		return Config{}, fmt.Errorf("OPENSCALER_REQUEST_TIMEOUT_SECONDS must be a positive integer")
	} else {
		cfg.RequestTimeout = time.Duration(seconds) * time.Second
	}
	if bytes, err := strconv.ParseInt(env("OPENSCALER_MAX_BODY_BYTES", "8388608"), 10, 64); err != nil || bytes < 1024 {
		return Config{}, fmt.Errorf("OPENSCALER_MAX_BODY_BYTES must be at least 1024")
	} else {
		cfg.MaxBodyBytes = bytes
	}
	if cfg.RateLimitRPM, err = parseNonNegativeInt("OPENSCALER_RATE_LIMIT_RPM", 60); err != nil {
		return Config{}, err
	}
	if cfg.Concurrency, err = parseNonNegativeInt("OPENSCALER_CONCURRENCY", 8); err != nil {
		return Config{}, err
	}
	if cfg.SupplyEnabled && cfg.AuthDisabled {
		return Config{}, fmt.Errorf("supply publication requires private gateway authentication")
	}
	if !cfg.AuthDisabled && len(cfg.APIKeys) == 0 {
		return Config{}, fmt.Errorf("set OPENSCALER_API_KEYS or explicitly set OPENSCALER_AUTH_DISABLED=true")
	}
	if cfg.AdminPassword == "" {
		return Config{}, fmt.Errorf("OPENSCALER_ADMIN_PASSWORD is required")
	}
	return cfg, nil
}

func parseNonNegativeInt(name string, fallback int) (int, error) {
	value, err := strconv.Atoi(env(name, strconv.Itoa(fallback)))
	if err != nil || value < 0 {
		return 0, fmt.Errorf("%s must be a non-negative integer", name)
	}
	return value, nil
}

func ProviderKeyEnv(provider string) string {
	provider = strings.ToUpper(strings.NewReplacer("-", "_", ".", "_").Replace(provider))
	return secretOrEnv("OPENSCALER_" + provider + "_API_KEY")
}

func secretOrEnv(name string) string {
	if file := strings.TrimSpace(os.Getenv(name + "_FILE")); file != "" {
		if data, err := os.ReadFile(file); err == nil {
			return strings.TrimSpace(string(data))
		}
	}
	return strings.TrimSpace(os.Getenv(name))
}

func env(name, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(name)); value != "" {
		return value
	}
	return fallback
}

func splitCSV(value string) []string {
	var out []string
	for _, item := range strings.Split(value, ",") {
		if item = strings.TrimSpace(item); item != "" {
			out = append(out, item)
		}
	}
	return out
}

func parseBool(name string, fallback bool) (bool, error) {
	value := strings.TrimSpace(os.Getenv(name))
	if value == "" {
		return fallback, nil
	}
	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return false, fmt.Errorf("%s must be true or false", name)
	}
	return parsed, nil
}
