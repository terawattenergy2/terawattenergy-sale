// import React from "react";
// import { Button, Image, Modal } from "react-bootstrap";

// function ModelSuggest({ show, onClose, data, getDriveImageUrl }) {
//   // if (!data) return null;

//   const imageProduct = data.img_product
//     ? getDriveImageUrl(data.img_product)
//     : "";
// console.log('data', data);

//   const imageAddOn = data.img_add_1 ? getDriveImageUrl(data.img_add_1) : "";
//   const imageAddOn2 = data.img_add_2 ? getDriveImageUrl(data.img_add_2) : "";

//   return (
//     <Modal
//       show={show}
//       onHide={onClose}
//       centered
//       size="lg"
//       contentClassName="card-modal"
//     >
//       <Modal.Header closeButton>
//         <Modal.Title>{data.ans_product || "รุ่นที่แนะนำ"}</Modal.Title>
//       </Modal.Header>

//       <Modal.Body className="text-center">
//         {imageProduct && (
//           <Image
//             className="img-modal"
//             alt={data.ans_product || "สินค้าแนะนำ"}
//             src={imageProduct}
//             fluid
//           />
//         )}
//         <p>{data.detail_product}</p>
//         <p className="mt-3 mb-0">Add on:</p>

//         <p>{data.ans_add_on_1}</p>
//         {imageAddOn && (
//           <Image
//             className="img-modal"
//             alt={data.ans_product || "สินค้าแนะนำ"}
//             src={imageAddOn}
//             fluid
//           />
//         )}
//         <p>{data.ans_add_on_2}</p>

//         {imageAddOn2 && (
//           <Image
//             className="img-modal"
//             alt={data.ans_product || "สินค้าแนะนำ"}
//             src={imageAddOn2}
//             fluid
//           />
//         )}
//         {/* <p className="mt-3 mb-0">
//           {data.detail || "รายละเอียดรุ่นสินค้าที่แนะนำ"}
//         </p> */}
//       </Modal.Body>

//       {/* <Modal.Footer>
//         <Button variant="secondary" onClick={onClose}>
//           ปิด
//         </Button>

//         <Button variant="primary">
//           ดูรายละเอียด
//         </Button>
//       </Modal.Footer> */}
//     </Modal>
//   );
// }

// export default ModelSuggest;
