package config

import "testing"

func TestLoadAdminCredentials(t *testing.T) {
	t.Setenv("OPENSCALER_API_KEYS", "client-key")
	t.Setenv("OPENSCALER_ADMIN_USERNAME", "console-admin")
	t.Setenv("OPENSCALER_ADMIN_PASSWORD", "console-password")
	t.Setenv("OPENSCALER_MANAGEMENT_TOKEN", "")

	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.AdminUsername != "console-admin" || cfg.AdminPassword != "console-password" {
		t.Fatalf("unexpected administrator credentials: username=%q password=%q", cfg.AdminUsername, cfg.AdminPassword)
	}
}

func TestLoadPublicURL(t *testing.T) {
	t.Setenv("OPENSCALER_API_KEYS", "client-key")
	t.Setenv("OPENSCALER_ADMIN_PASSWORD", "console-password")
	t.Setenv("OPENSCALER_PUBLIC_URL", "http://192.168.1.25:8080/")

	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.PublicURL != "http://192.168.1.25:8080" {
		t.Fatalf("unexpected public URL: %q", cfg.PublicURL)
	}
}

func TestLoadSpecificLANListenAddress(t *testing.T) {
	t.Setenv("OPENSCALER_API_KEYS", "client-key")
	t.Setenv("OPENSCALER_ADMIN_PASSWORD", "console-password")
	t.Setenv("OPENSCALER_LAN_LISTEN_ADDR", "192.168.1.25:8080")

	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.LANListenAddr != "192.168.1.25:8080" {
		t.Fatalf("unexpected LAN listen address: %q", cfg.LANListenAddr)
	}
}

func TestRejectsUnspecifiedLANListenAddress(t *testing.T) {
	t.Setenv("OPENSCALER_API_KEYS", "client-key")
	t.Setenv("OPENSCALER_ADMIN_PASSWORD", "console-password")
	t.Setenv("OPENSCALER_LAN_LISTEN_ADDR", "0.0.0.0:8080")
	if _, err := Load(); err == nil {
		t.Fatal("expected unspecified LAN listen address to be rejected")
	}
}

func TestLoadMigratesManagementTokenToAdminPassword(t *testing.T) {
	t.Setenv("OPENSCALER_API_KEYS", "client-key")
	t.Setenv("OPENSCALER_ADMIN_USERNAME", "")
	t.Setenv("OPENSCALER_ADMIN_PASSWORD", "")
	t.Setenv("OPENSCALER_MANAGEMENT_TOKEN", "legacy-management-token")

	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.AdminUsername != "admin" || cfg.AdminPassword != "legacy-management-token" {
		t.Fatalf("legacy credentials were not migrated: username=%q password=%q", cfg.AdminUsername, cfg.AdminPassword)
	}
}

func TestSupplyRequiresPrivateAuthentication(t *testing.T) {
	t.Setenv("OPENSCALER_SUPPLY_ENABLED", "true")
	t.Setenv("OPENSCALER_AUTH_DISABLED", "true")
	t.Setenv("OPENSCALER_ADMIN_PASSWORD", "test-admin")
	if _, err := Load(); err == nil {
		t.Fatal("supply must not run with unauthenticated private API")
	}
}
