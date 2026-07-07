import { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    try {
        const { shop, payload } = await authenticate.webhook(request);

        console.log(`Received subscription update webhook for ${shop}:`, JSON.stringify(payload));

        const appSubscription = payload.app_subscription || payload;
        const subscriptionId = appSubscription.admin_graphql_api_id || appSubscription.id;
        const status = appSubscription.status;

        if (!subscriptionId || !status) {
            console.error("Missing subscriptionId or status in payload:", payload);
            return new Response("Invalid payload", { status: 400 });
        }

        let mappedStatus: "ACTIVE" | "CANCELLED" | "EXPIRED" | "PENDING" | "DECLINED" | "FROZEN";
        const statusUpper = status.toUpperCase();
        if (statusUpper === "ACTIVE") {
            mappedStatus = "ACTIVE";
        } else if (statusUpper === "CANCELLED") {
            mappedStatus = "CANCELLED";
        } else if (statusUpper === "EXPIRED") {
            mappedStatus = "EXPIRED";
        } else if (statusUpper === "DECLINED") {
            mappedStatus = "DECLINED";
        } else if (statusUpper === "FROZEN") {
            mappedStatus = "FROZEN";
        } else {
            mappedStatus = "PENDING";
        }

        if (mappedStatus === "ACTIVE") {
            await prisma.activeSubscription.upsert({
                where: { shopDomain: shop },
                create: {
                    shopDomain: shop,
                    subscriptionId: String(subscriptionId),
                    popupShown: true,
                },
                update: {
                    subscriptionId: String(subscriptionId),
                    popupShown: true,
                },
            });
        } else if (
            mappedStatus === "CANCELLED" ||
            mappedStatus === "EXPIRED" ||
            mappedStatus === "DECLINED" ||
            mappedStatus === "FROZEN"
        ) {
            await prisma.activeSubscription.deleteMany({
                where: { shopDomain: shop },
            });
        }

        // Keep history record
        await prisma.subscriptionHistory.create({
            data: {
                shopDomain: shop,
                subscriptionId: String(subscriptionId),
                status: mappedStatus,
            },
        });

        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error("Error handling subscription update webhook:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
};
