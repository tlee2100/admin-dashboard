"use client";

import React from "react";
import { Refine, type AuthProvider } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";
import { useSession, signOut } from "next-auth/react";
import { customDataProvider } from "./data-provider";

export function RefineProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const authProvider: AuthProvider = {
    // Đăng nhập: Vì đã dùng form server action ở /login riêng rồi nên Refine không cần xử lý, chỉ trả về true
    login: async () => ({ success: true }),
    // Đăng xuất: Gọi signOut của NextAuth
    logout: async () => {
      await signOut({ callbackUrl: "/login" });
      return {
        success: true,
        redirectTo: "/login",
      };
    },
    // Kiểm tra trạng thái: Để Refine biết user có quyền vào trang hay bị văng ra
    check: async () => {
      if (status === "unauthenticated") {
        return {
          authenticated: false,
          redirectTo: "/login",
        };
      }
      return {
        authenticated: true,
      };
    },
    // Lấy thông tin phân quyền (Role)
    getPermissions: async () => {
      return session?.user?.role || null;
    },
    // Lấy thông tin User (Identity) để Refine có thể tự động hiển thị Avatar/Tên (nếu dùng giao diện có sẵn)
    getIdentity: async () => {
      if (session?.user) {
        return {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          avatar: session.user.avatarUrl,
        };
      }
      return null;
    },
    // Hàm xử lý lỗi toàn cục: Khi gọi API bị lỗi 401 hoặc 403, Refine sẽ tự động gọi hàm logout
    onError: async (error) => {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return {
          logout: true,
        };
      }
      return {};
    },
  };

  return (
    <Refine
      routerProvider={routerProvider}
      authProvider={authProvider} //Truyền authProvider
      dataProvider={customDataProvider(
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
        session?.accessToken as string,
      )}
      resources={[
        {
          name: "organizations",
          list: "/dashboard/organizations",
          create: "/dashboard/organizations/create",
          edit: "/dashboard/organizations/edit/:id",
          show: "/dashboard/organizations/:id",
          meta: {
            label: "Tổ chức", // Tên hiển thị trên sidebar (nếu dùng UI package)
            canDelete: true,
          },
        },
        {
          name: "users",
          list: "/dashboard/users",
          create: "/dashboard/users/create",
          edit: "/dashboard/users/edit/:id",
          meta: {
            label: "Người dùng",
            canDelete: true,
          },
        },
        {
          name: "sites",
          list: "/dashboard/sites",
          // Sites sẽ dùng Modal nên không cần create/edit riêng ở đây
          meta: {
            label: "Website",
            canDelete: true,
          },
        },
        {
          name: "documents",
          meta: {
            label: "Tài liệu",
            canDelete: true,
          },
        },
      ]}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
      }}
    >
      {children}
    </Refine>
  );
}
