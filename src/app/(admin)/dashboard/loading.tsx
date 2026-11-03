import { Card, Col, Row, Skeleton } from "antd";

const DashboardLoading = () => (
    <div aria-label="Đang tải thống kê" className="p-4">
        <Row gutter={[16, 16]}>
            {Array.from({ length: 4 }).map((_, i) => (
                <Col xs={24} sm={12} xl={6} key={i}>
                    <Card>
                        <Skeleton active paragraph={{ rows: 1 }} />
                    </Card>
                </Col>
            ))}
        </Row>
        <Card className="mt-4">
            <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
    </div>
);

export default DashboardLoading;