import VerifyForm from "@/components/store/verify.form";
import { notFound } from "next/navigation";

interface IProps {
  params: Promise<{ id: string }>;
}

const VerifyPage = async ({ params }: IProps) => {
  const { id } = await params;

  // Id lấy từ URL rồi gửi lên backend nên chỉ nhận đúng định dạng ObjectId
  if (!/^[a-f\d]{24}$/i.test(id)) notFound();

  return <VerifyForm id={id} />;
};

export default VerifyPage;
