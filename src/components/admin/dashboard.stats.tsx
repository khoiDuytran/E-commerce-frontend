"use client";

import {
    Alert,
    Avatar,
    Badge,
    Card,
    Col,
    Empty,
    Progress,
    Row,
    Statistic,
    Table,
    Tag,
    Tooltip,
    Typography,
} from "antd";
import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    DollarOutlined,
    InfoCircleOutlined,
    RiseOutlined,
    ShoppingCartOutlined,
    TeamOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

/* ---------- Types (khớp với DashboardService.getStats) ---------- */
interface IProductLite {
    _id: string;
    name: string;
    slug: string;
    images?: string[];
    basePrice: number;
    stock: number;
    soldCount?: number;
}

interface IPendingOrder {
    _id: string;
    orderCode: string;
    shippingAddress?: { fullName?: string; phone?: string };
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
    items?: unknown[];
}

interface IProfitPeriod {
    profit: number;
    netSales: number;
    orders: number;
    margin: number | null;
}

export interface IDashboardStats {
    kpi: {
        revenue: {
            total: number;
            today: number;
            thisMonth: number;
            lastMonth: number;
        };
        orders: {
            total: number;
            pending: number;
            confirmed: number;
            shipping: number;
            delivered: number;
            cancelled: number;
            refunded: number;
        };
        customers: { total: number; newThisMonth: number };
        products: { activeTotal: number; lowStockTotal: number };
        pendingRefunds: number;
        profit: {
            total: IProfitPeriod;
            thisMonth: IProfitPeriod;
            lastMonth: IProfitPeriod;
            ordersMissingCost: number;
        };
    };
    charts: {
        revenueLast7Days: { _id: string; revenue: number; ordersCount: number }[];
        statusDistribution: { status: string; count: number }[];
    };
    topSellingProducts: IProductLite[];
    recentPendingOrders: IPendingOrder[];
    lowStockList: IProductLite[];
}

interface IProps {
    data?: IDashboardStats;
    error?: string;
}

/* ---------- Helpers ---------- */
const formatVND = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
        value || 0,
    );

const formatDate = (value: string) =>
    new Date(value).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Chờ duyệt", color: "gold" },
    CONFIRMED: { label: "Đã xác nhận", color: "blue" },
    SHIPPING: { label: "Đang giao", color: "cyan" },
    DELIVERED: { label: "Đã giao", color: "green" },
    CANCELLED: { label: "Đã huỷ", color: "red" },
    REFUNDED: { label: "Hoàn tiền", color: "purple" },
    RETURN_REQUESTED: { label: "Yêu cầu trả hàng", color: "orange" },
};

const getStatus = (status: string) =>
    STATUS_LABEL[status.toUpperCase()] ?? { label: status, color: "default" };

// % thay đổi so với kỳ trước; null khi kỳ trước bằng 0 (không chia được)
const percentChange = (current: number, previous: number) =>
    previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : null;

const Growth = ({ value }: { value: number | null }) =>
    value === null ? null : (
        <Text type={value >= 0 ? "success" : "danger"}>
            {value >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}{" "}
            {Math.abs(value).toFixed(1)}%
        </Text>
    );

/* ---------- Component ---------- */
const DashboardStats = ({ data, error }: IProps) => {
    if (error || !data) {
        return (
            <div className="p-4">
                <Alert
                    type="error"
                    showIcon
                    message="Không thể tải thống kê"
                    description={error || "Dữ liệu không hợp lệ."}
                />
            </div>
        );
    }

    const { kpi, charts, topSellingProducts, recentPendingOrders, lowStockList } =
        data;

    const revenueGrowth = percentChange(
        kpi.revenue.thisMonth,
        kpi.revenue.lastMonth,
    );
    const { profit } = kpi;
    const profitGrowth = percentChange(
        profit.thisMonth.profit,
        profit.lastMonth.profit,
    );

    const maxRevenue = Math.max(
        ...charts.revenueLast7Days.map((d) => d.revenue),
        1,
    );

    /* --- columns --- */
    const pendingColumns: ColumnsType<IPendingOrder> = [
        {
            title: "Mã đơn",
            dataIndex: "orderCode",
            render: (v: string) => <Text strong>{v}</Text>,
        },
        {
            title: "Khách hàng",
            render: (_, r) => r.shippingAddress?.fullName || "—",
        },
        {
            title: "Tổng tiền",
            dataIndex: "total",
            align: "right",
            render: (v: number) => formatVND(v),
        },
        {
            title: "Thanh toán",
            dataIndex: "paymentStatus",
            render: (v: string) => <Tag>{v}</Tag>,
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            render: (v: string) => formatDate(v),
        },
    ];

    const productColumns = (showSold: boolean): ColumnsType<IProductLite> => [
        {
            title: "Sản phẩm",
            render: (_, r) => (
                <div className="flex items-center gap-3">
                    <Avatar shape="square" size={40} src={r.images?.[0]}>
                        {r.name?.[0]}
                    </Avatar>
                    <Text ellipsis style={{ maxWidth: 180 }}>
                        {r.name}
                    </Text>
                </div>
            ),
        },
        {
            title: "Giá",
            dataIndex: "basePrice",
            align: "right",
            render: (v: number) => formatVND(v),
        },
        showSold
            ? {
                title: "Đã bán",
                dataIndex: "soldCount",
                align: "right",
                render: (v?: number) => v ?? 0,
            }
            : {
                title: "Tồn kho",
                dataIndex: "stock",
                align: "right",
                render: (v: number) => (
                    <Tag color={v === 0 ? "red" : "orange"}>{v}</Tag>
                ),
            },
    ];

    return (
        <div className="p-4">
            <Title level={4} style={{ marginBottom: 16 }}>
                Thống kê tổng quan
            </Title>

            {/* KPI: các thẻ cùng hàng cao bằng nhau (h-full) */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} xl={6}>
                    <Card className="h-full">
                        <Statistic
                            title="Doanh thu tháng này"
                            value={kpi.revenue.thisMonth}
                            formatter={(v) => formatVND(Number(v))}
                            prefix={<DollarOutlined />}
                        />
                        <div>
                            <Growth value={revenueGrowth} />{" "}
                            <Text type="secondary">
                                {revenueGrowth === null && kpi.revenue.lastMonth === 0
                                    ? "Tháng trước chưa có doanh thu"
                                    : `so với tháng trước (${formatVND(kpi.revenue.lastMonth)})`}
                            </Text>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} xl={6}>
                    <Card className="h-full">
                        <Statistic
                            title="Lợi nhuận gộp tháng này"
                            value={profit.thisMonth.profit}
                            formatter={(v) => formatVND(Number(v))}
                            prefix={<RiseOutlined />}
                            styles={{
                                content: {
                                    color: profit.thisMonth.profit < 0 ? "#cf1322" : "#389e0d",
                                },
                            }}
                        />
                        <div>
                            <Text type="secondary">
                                Biên lợi nhuận{" "}
                                {profit.thisMonth.margin === null
                                    ? "—"
                                    : `${profit.thisMonth.margin}%`}
                            </Text>
                            {profitGrowth !== null && (
                                <>
                                    {" · "}
                                    <Growth value={profitGrowth} />
                                </>
                            )}
                        </div>
                        {profit.ordersMissingCost > 0 && (
                            <Tooltip title="Đơn có sản phẩm chưa nhập giá vốn lúc đặt hàng (gồm đơn cũ) nên không tính được lợi nhuận.">
                                <Text type="warning" className="cursor-help text-xs">
                                    <InfoCircleOutlined /> {profit.ordersMissingCost} đơn
                                    chưa có giá vốn, không tính
                                </Text>
                            </Tooltip>
                        )}
                    </Card>
                </Col>
                <Col xs={24} sm={12} xl={6}>
                    <Card className="h-full">
                        <Statistic
                            title="Doanh thu hôm nay"
                            value={kpi.revenue.today}
                            formatter={(v) => formatVND(Number(v))}
                        />
                        <Text type="secondary">Tổng: {formatVND(kpi.revenue.total)}</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={12} xl={6}>
                    <Card className="h-full">
                        <Statistic
                            title="Tổng đơn hàng"
                            value={kpi.orders.total}
                            prefix={<ShoppingCartOutlined />}
                        />
                        <Text type="warning">{kpi.orders.pending} đơn chờ duyệt</Text>
                    </Card>
                </Col>
                <Col xs={24} sm={12} xl={6}>
                    <Card className="h-full">
                        <Statistic
                            title="Khách hàng"
                            value={kpi.customers.total}
                            prefix={<TeamOutlined />}
                        />
                        <Text type="secondary">
                            +{kpi.customers.newThisMonth} trong tháng này
                        </Text>
                    </Card>
                </Col>
                <Col xs={24} sm={12} xl={6}>
                    <Card className="h-full">
                        <Statistic
                            title="Sản phẩm đang bán"
                            value={kpi.products.activeTotal}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} xl={6}>
                    <Card className="h-full">
                        <Statistic
                            title="Sắp hết hàng"
                            value={kpi.products.lowStockTotal}
                            styles={{ content: { color: "#fa8c16" } }}
                            prefix={<WarningOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} xl={6}>
                    <Card className="h-full">
                        <Statistic
                            title="Yêu cầu hoàn hàng chờ duyệt"
                            value={kpi.pendingRefunds}
                            styles={{
                                content: {
                                    color: kpi.pendingRefunds > 0 ? "#cf1322" : undefined,
                                },
                            }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Charts */}
            <Row gutter={[16, 16]} className="mt-4">
                <Col xs={24} lg={14}>
                    <Card title="Doanh thu 7 ngày gần nhất" className="h-full">
                        {charts.revenueLast7Days.length === 0 ? (
                            <Empty description="Chưa có dữ liệu" />
                        ) : (
                            <div className="flex flex-col gap-3">
                                {charts.revenueLast7Days.map((d) => (
                                    <div key={d._id}>
                                        <div className="flex justify-between">
                                            <Text>{d._id}</Text>
                                            <Text strong>
                                                {formatVND(d.revenue)}{" "}
                                                <Text type="secondary">({d.ordersCount} đơn)</Text>
                                            </Text>
                                        </div>
                                        <Progress
                                            percent={Math.round((d.revenue / maxRevenue) * 100)}
                                            showInfo={false}
                                            strokeColor="#1677ff"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </Col>
                <Col xs={24} lg={10}>
                    <Card title="Phân bố trạng thái đơn hàng" className="h-full">
                        {charts.statusDistribution.length === 0 ? (
                            <Empty description="Chưa có dữ liệu" />
                        ) : (
                            <div className="flex flex-col gap-3">
                                {charts.statusDistribution.map((s) => {
                                    const st = getStatus(s.status);
                                    return (
                                        <div key={s.status}>
                                            <div className="flex justify-between">
                                                <Badge color={st.color} text={st.label} />
                                                <Text>{s.count}</Text>
                                            </div>
                                            <Progress
                                                percent={
                                                    kpi.orders.total
                                                        ? Math.round((s.count / kpi.orders.total) * 100)
                                                        : 0
                                                }
                                                size="small"
                                                strokeColor={st.color === "default" ? undefined : st.color}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Tables */}
            <Row gutter={[16, 16]} className="mt-4">
                <Col xs={24} xl={14}>
                    <Card title="Đơn hàng mới đang chờ duyệt" className="h-full">
                        <Table
                            rowKey="_id"
                            size="small"
                            pagination={false}
                            columns={pendingColumns}
                            dataSource={recentPendingOrders}
                            scroll={{ x: "max-content" }}
                            locale={{ emptyText: <Empty description="Không có đơn chờ duyệt" /> }}
                        />
                    </Card>
                </Col>
                <Col xs={24} xl={10}>
                    <Card title="Top 5 sản phẩm bán chạy" className="h-full">
                        <Table
                            rowKey="_id"
                            size="small"
                            pagination={false}
                            columns={productColumns(true)}
                            dataSource={topSellingProducts}
                            scroll={{ x: "max-content" }}
                        />
                    </Card>
                </Col>
                <Col xs={24}>
                    <Card title="Sản phẩm tồn kho thấp">
                        <Table
                            rowKey="_id"
                            size="small"
                            pagination={false}
                            columns={productColumns(false)}
                            dataSource={lowStockList}
                            scroll={{ x: "max-content" }}
                            locale={{ emptyText: <Empty description="Kho hàng ổn định" /> }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DashboardStats;