import { DataProvider, HttpError } from "@refinedev/core";

// Hàm xử lý lỗi từ Backend NestJS (class-validator) thành chuẩn của Refine
const handleError = async (res: Response) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error: HttpError = {
      message: errorData.message || "Đã xảy ra lỗi hệ thống",
      statusCode: res.status,
    };

    // Xử lý mảng lỗi của NestJS class-validator (Ví dụ: "email must be an email")
    if (Array.isArray(errorData.message)) {
      error.message = "Vui lòng kiểm tra lại thông tin nhập vào";
      const validationErrors: Record<string, string[]> = {};
      errorData.message.forEach((msg: string) => {
        const field = msg.split(" ")[0]; // Lấy chữ đầu tiên làm tên field (ví dụ 'email')
        if (!validationErrors[field]) validationErrors[field] = [];
        validationErrors[field].push(msg);
      });
      error.errors = validationErrors; // Gắn mảng lỗi chi tiết để Refine map vào từng ô Input
    }
    throw error;
  }
};

// DataProvider Factory nhận vào accessToken để gửi kèm trong Header
export const customDataProvider = (
  apiUrl: string,
  accessToken?: string,
): DataProvider => {
  const headers = new Headers({
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  });

  return {
    getApiUrl: () => apiUrl,

    // 1. Lấy danh sách (Có phân trang)
    getList: async ({ resource, pagination, filters, sorters }) => {
      const url = new URL(`${apiUrl}/${resource}`);

      // Map phân trang từ Refine sang NestJS
      if (pagination) {
        const page =
          (pagination as { current?: number; currentPage?: number }).current ||
          (pagination as { current?: number; currentPage?: number })
            .currentPage;
        const limit = pagination.pageSize;
        const mode = pagination.mode;

        if (mode !== "off" && page && limit) {
          url.searchParams.append("page", String(page));
          url.searchParams.append("limit", String(limit));
        }
      }

      // Map filters
      if (filters) {
        filters.forEach((filter) => {
          if (
            "field" in filter &&
            filter.value !== undefined &&
            filter.value !== ""
          ) {
            url.searchParams.append(filter.field, String(filter.value));
          }
        });
      }

      // Map sorters (Chuyển dạng sorter của Refine thành ?sortBy=field&sortOrder=ASC/DESC)
      if (sorters && sorters.length > 0) {
        const sort = sorters[0];
        url.searchParams.append("sortBy", sort.field);
        url.searchParams.append("sortOrder", sort.order.toUpperCase());
      }

      const res = await fetch(url.toString(), { headers });
      await handleError(res);
      const data = await res.json();

      // Giả định backend NestJS trả về { data: [...], total: 100 }
      // Nếu BE của bạn chỉ trả về mảng [...] thì đổi thành return { data, total: data.length }
      return {
        data: data.data || data,
        total: data.total || data.length,
      };
    },

    // 2. Lấy 1 bản ghi
    getOne: async ({ resource, id }) => {
      const res = await fetch(`${apiUrl}/${resource}/${id}`, { headers });
      await handleError(res);
      const data = await res.json();
      return { data };
    },

    // 3. Tạo mới
    create: async ({ resource, variables }) => {
      const res = await fetch(`${apiUrl}/${resource}`, {
        method: "POST",
        headers,
        body: JSON.stringify(variables),
      });
      await handleError(res);
      const data = await res.json();
      return { data };
    },

    // 4. Cập nhật
    update: async ({ resource, id, variables }) => {
      const res = await fetch(`${apiUrl}/${resource}/${id}`, {
        method: "PATCH", // NestJS mặc định dùng PATCH cho update
        headers,
        body: JSON.stringify(variables),
      });
      await handleError(res);
      const data = await res.json();
      return { data };
    },

    // 5. Xóa
    deleteOne: async ({ resource, id }) => {
      const res = await fetch(`${apiUrl}/${resource}/${id}`, {
        method: "DELETE",
        headers,
      });
      await handleError(res);
      return {
        data: { id } as unknown as import("@refinedev/core").BaseRecord,
      };
    },
  };
};
