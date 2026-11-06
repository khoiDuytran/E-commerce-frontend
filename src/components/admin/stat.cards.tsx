"use client";

import {
  AppstoreOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
  DollarOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  FireOutlined,
  FolderOutlined,
  GiftOutlined,
  InboxOutlined,
  PartitionOutlined,
  RollbackOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  StopOutlined,
  TeamOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { formatVnd } from "@/utils/store";
import { createElement } from "react";
import { Card, Col, Row, Statistic, Typography } from "antd";

const { Text } = Typography;

// Icon dùng React context nên chỉ render ở client; server truyền tên icon
const ICONS = {
  Appstore: AppstoreOutlined,
  Car: CarOutlined,
  CheckCircle: CheckCircleOutlined,
  ClockCircle: ClockCircleOutlined,
  CloseCircle: CloseCircleOutlined,
  Crown: CrownOutlined,
  Dollar: DollarOutlined,
  EyeInvisible: EyeInvisibleOutlined,
  Eye: EyeOutlined,
  Fire: FireOutlined,
  Folder: FolderOutlined,
  Gift: GiftOutlined,
  Inbox: InboxOutlined,
  Partition: PartitionOutlined,
  Rollback: RollbackOutlined,
  ShoppingCart: ShoppingCartOutlined,
  Shopping: ShoppingOutlined,
  Stop: StopOutlined,
  Team: TeamOutlined,
  Warning: WarningOutlined,
};

export type StatIcon = keyof typeof ICONS;

export interface IStatCard {
  title: string;
  value: number;
  icon: StatIcon;
  color?: string;
  note?: string;
  currency?: boolean;
}

// Hàng thẻ thông số dùng chung cho các trang quản lý
const StatCards = ({ cards }: { cards: IStatCard[] }) => {
  // 5 thẻ thì chia đều 1 hàng; số khác thì chia theo lưới 24 cột
  const xl =
    cards.length === 5 ? { flex: "20%" } : Math.floor(24 / cards.length);

  return (
    <Row gutter={[16, 16]} className="mb-4">
      {cards.map((card) => (
        <Col key={card.title} xs={24} sm={12} lg={8} xl={xl}>
          <Card className="h-full">
            <Statistic
              title={card.title}
              value={card.value}
              prefix={createElement(ICONS[card.icon])}
              formatter={
                card.currency ? (value) => formatVnd(Number(value)) : undefined
              }
              styles={
                card.color ? { content: { color: card.color } } : undefined
              }
            />
            {card.note && <Text type="secondary">{card.note}</Text>}
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default StatCards;
