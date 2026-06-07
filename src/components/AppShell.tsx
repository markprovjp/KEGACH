"use client";

import {
  AppstoreOutlined,
  AuditOutlined,
  CarOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  MoonOutlined,
  PlusCircleOutlined,
  SunOutlined
} from "@ant-design/icons";
import { ConfigProvider, Layout, Menu, Switch, theme } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useState } from "react";

const { Header, Sider, Content } = Layout;
type ThemeMode = "light" | "dark";

const menuItems = [
  { key: "/", icon: <DashboardOutlined />, label: <Link href="/">Tổng quan</Link> },
  { key: "/orders/new", icon: <PlusCircleOutlined />, label: <Link href="/orders/new">Tạo đơn</Link> },
  { key: "/board", icon: <AppstoreOutlined />, label: <Link href="/board">Kanban</Link> },
  { key: "/inventory", icon: <DatabaseOutlined />, label: <Link href="/inventory">Kho</Link> },
  { key: "/reconciliation", icon: <AuditOutlined />, label: <Link href="/reconciliation">Đối soát</Link> },
  { key: "/dispatch", icon: <CarOutlined />, label: <Link href="/dispatch">Điều xe</Link> }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const selectedKey = menuItems.some((item) => item.key === pathname) ? pathname : "/";
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("kegach-theme");
    if (stored === "dark" || stored === "light") setThemeMode(stored);
    else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) setThemeMode("dark");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem("kegach-theme", themeMode);
  }, [themeMode]);

  const antdTheme = useMemo(() => ({
    algorithm: themeMode === "dark" ? [theme.darkAlgorithm, theme.compactAlgorithm] : [theme.defaultAlgorithm, theme.compactAlgorithm],
    token: {
      colorPrimary: "#1677ff",
      borderRadius: 8,
      fontFamily: '"Segoe UI", sans-serif'
    },
    components: {
      Layout: {
        bodyBg: themeMode === "dark" ? "#0f172a" : "#f4f6f8",
        headerBg: themeMode === "dark" ? "#111827" : "#ffffff",
        siderBg: themeMode === "dark" ? "#111827" : "#ffffff"
      }
    }
  }), [themeMode]);

  return (
    <ConfigProvider theme={antdTheme}>
      <Layout className={`page-shell theme-${themeMode}`}>
        <Sider width={236} theme={themeMode}>
          <div className="brand-block">
            <h2 className="brand-title">KeGach Ops</h2>
            <div className="brand-subtitle">Kiot là sổ cái, app là vận hành</div>
          </div>
          <Menu theme={themeMode} mode="inline" selectedKeys={[selectedKey]} items={menuItems} />
        </Sider>
        <Layout>
          <Header className="app-header">
            <strong>Long Hải Plastic Operations</strong>
            <Switch
              checked={themeMode === "dark"}
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
              onChange={(checked) => setThemeMode(checked ? "dark" : "light")}
            />
          </Header>
          <Content className="content-shell">{children}</Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
