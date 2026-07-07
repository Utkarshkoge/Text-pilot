import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { LoaderFunctionArgs } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  /* 1️⃣ Fetch active subscription */
  let dbActive = await prisma.activeSubscription.findUnique({
    where: { shopDomain },
    select: {
      popupShown: true,
    },
  });

  return {
    showPopup: dbActive?.popupShown || false,
  };
};
