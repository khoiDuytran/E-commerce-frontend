import { auth } from "@/auth";
import UserTable from "@/components/admin/user.table";
import { sendRequest } from "@/utils/api";
import { toErrorText } from "@/utils/store";

interface IProps {
  params: { id: string };
  searchParams: Promise<{
    current?: string;
    pageSize?: string;
  }>;
}

const ManageUserPage = async (props: IProps) => {
  const searchParams = await props.searchParams;

  const current = Number(searchParams.current ?? 1);
  const pageSize = Number(searchParams.pageSize ?? 10);
  const session = await auth();

  let res: IBackendRes<{ results: IUserRecord[]; meta: IPageMeta }> | undefined;
  let error: string | undefined;
  try {
    res = await sendRequest<
      IBackendRes<{ results: IUserRecord[]; meta: IPageMeta }>
    >({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users`,
      method: "GET",
      queryParams: {
        current,
        pageSize,
      },
      headers: {
        Authorization: `Bearer ${session?.user?.access_token}`,
      },
      nextOption: {
        next: { tags: ["list-users"] },
      },
    });
    if (!res?.data?.results) {
      error = toErrorText(res?.message, "Yêu cầu tải người dùng thất bại.");
    }
  } catch {
    error = "Không kết nối được máy chủ. Vui lòng kiểm tra backend đang chạy.";
  }

  return (
    <div>
      <UserTable
        users={res?.data?.results ?? []}
        meta={res?.data?.meta ?? { current, pageSize, pages: 0, total: 0 }}
        error={error}
      />
    </div>
  );
};

export default ManageUserPage;
