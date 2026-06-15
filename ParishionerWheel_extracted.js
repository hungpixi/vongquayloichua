Hr=()=> {
  let {
    parishSlug:e, wheelSlug:t, wheelId:n
  }=ut(), [r, i]=(0, _.useState)(null), [a, o]=(0, _.useState)(null), [s, c]=(0, _.useState)([]), [l, u]=(0, _.useState)(!0), [d, f]=(0, _.useState)(null), [p, m]=(0, _.useState)(!1), [h, g]=(0, _.useState)(null), [v, y]=(0, _.useState)(!1), [b, x]=(0, _.useState)(null), [S, C]=(0, _.useState)(!1), [w, T]=(0, _.useState)(null), E=(0, _.useRef)(null), D=(0, _.useRef)(null), O=(0, _.useRef)(0), k=(0, _.useRef)(0), ee=(0, _.useRef)(null), te=(0, _.useRef)(null), A=e=> {
    switch(e) {
      case`red`:return[`#7F1D1D`, `#D8B43F`, `#450a0a`, `#FFF8E8`, `#991b1b`, `#E6B93D`];
      case`blue`:return[`#0E4B75`, `#D8B43F`, `#072a44`, `#FFF8E8`, `#1A5F7A`, `#E6B93D`];
      case`green`:return[`#0F5E3D`, `#D8B43F`, `#0a3d28`, `#FFF8E8`, `#1F8A55`, `#E6B93D`];
      default:return[`#0F3D2E`, `#D8B43F`, `#1F6B4A`, `#FFF8E8`, `#2F6B4F`, `#E6B93D`]
    }
  };
  (0, _.useEffect)(()=>(re(), ()=> {
    ee.current&&cancelAnimationFrame(ee.current)
  }), [e, t, n]);
  let ne=e=> {
    T(e), setTimeout(()=>T(null), 3e3)
  }, re=async()=> {
    u(!0), f(null);
    try {
      let r=null;
      if(n?r=await F.getWheelById(n):e&&t&&(r=await F.getWheelBySlugs(e, t)), !r) {
        f(`Không tìm thấy Vòng quay hoặc đường dẫn đã hết hạn.`);
        return
      }i(r.parish), o(r.wheel);
      let a=await F.getBlessings(r.wheel.id);
      c(a);
      let s=null;
      if(r.wheel.lock_duration!==`none`) {
        let e=sessionStorage.getItem(`session_spun_blessing_${r.wheel.id}`);
        if(e&&(s=JSON.parse(e)), !s) {
          let e=localStorage.getItem(`spun_blessing_${r.wheel.id}`);
          if(e) {
            let t=JSON.parse(e), n=Date.now();
            r.wheel.lock_duration===`forever`?s=t:r.wheel.lock_duration===`24h`&&(n-t.timestamp<1440*60*1e3?s=t:localStorage.removeItem(`spun_blessing_${r.wheel.id}`))
          }
        }
      }if(s) {
        x(s), g(a.find(e=>e.id===s.id)|| {
          id:s.id, wheel_id:r.wheel.id, category:s.itemSpun, quote:s.quote, text:s.text, is_custom:!0
        }), y(!0);
        let e=a.findIndex(e=>e.id===s.id);
        if(e!==-1&&a.length>0) {
          let t=2*Math.PI/a.length;
          O.current=2*Math.PI-(e+.5)*t
        }
      }
    }catch(e) {
      console.error(e), f(`Lỗi kết nối máy chủ.`)
    }finally {
      u(!1)
    }
  }, ie=()=> {
    D.current||=new(window.AudioContext||window.webkitAudioContext), D.current.state===`suspended`&&D.current.resume()
  }, j=()=> {
    if(!a?.enable_sound||!D.current)return;
    let e=D.current, t=e.createOscillator(), n=e.createGain();
    t.type=`triangle`, t.frequency.setValueAtTime(600, e.currentTime), t.frequency.exponentialRampToValueAtTime(150, e.currentTime+.04), n.gain.setValueAtTime(.08, e.currentTime), n.gain.exponentialRampToValueAtTime(.001, e.currentTime+.04), t.connect(n), n.connect(e.destination), t.start(), t.stop(e.currentTime+.05)
  }, M=()=> {
    if(!a?.enable_sound||!D.current)return;
    let e=D.current, t=e.currentTime;
    [280, 420, 560, 700].forEach((n, r)=> {
      let i=e.createOscillator(), a=e.createGain();
      i.type=`sine`, i.frequency.value=n, a.gain.setValueAtTime(r===0?.15:.04, t), a.gain.exponentialRampToValueAtTime(.001, t+(r===0?2.5:1.5)), i.connect(a), a.connect(e.destination), i.start(t), i.stop(t+3)
    })
  };
  (0, _.useEffect)(()=> {
    !l&&E.current&&s.length>0&&a&&ae()
  }, [l, s, a]);
  let ae=()=> {
    let e=E.current;
    if(!e||!a)return;
    let t=e.getContext(`2d`);
    if(!t)return;
    let n=e.width, r=e.height, i=n/2, o=r/2, c=Math.min(n, r)/2-10;
    t.clearRect(0, 0, n, r);
    let l=s.length, u=2*Math.PI/l, d=A(a.theme_preset);
    t.save(), t.translate(i, o), t.rotate(O.current);
    for(let e=0;
    e<l;
    e++) {
      let n=e*u;
      t.beginPath(), t.fillStyle=d[e%d.length], t.moveTo(0, 0), t.arc(0, 0, c, n, n+u), t.lineTo(0, 0), t.fill(), t.strokeStyle=`#D8B43F`, t.lineWidth=1.5, t.stroke(), t.save(), t.fillStyle=e%d.length===3?`var(--color-primary)`:`#FFFFFF`, t.rotate(n+u/2), t.textAlign=`right`, t.textBaseline=`middle`, t.font=`bold ${l>50?`8px`:l>20?`11px`:`13px`} 'Be Vietnam Pro', sans-serif`;
      let r=s[e].category||`Mục ${e+1}`;
      t.fillText(r, c-20, 0), t.restore()
    }t.restore(), t.beginPath(), t.arc(i, o, 45, 0, 2*Math.PI), t.fillStyle=`#D8B43F`, t.fill(), t.strokeStyle=`#FFFFFF`, t.lineWidth=3, t.stroke(), t.beginPath(), t.arc(i, o, 38, 0, 2*Math.PI), t.fillStyle=`var(--color-primary)`, t.fill()
  }, oe=(e, t)=> {
    O.current+=k.current;
    let n=s.length, r=2*Math.PI/n;
    if(Math.floor((O.current-k.current)/r)!==Math.floor(O.current/r)&&j(), k.current*=.982, k.current<.002) {
      m(!1), k.current=0;
      let e=(2*Math.PI-O.current%(2*Math.PI))%(2*Math.PI), t=s[Math.floor(e/r)%n];
      g(t), M(), a?.enable_confetti&&Br( {
        particleCount:80, spread:60, origin: {
          y:.6
        }
      }), F.recordSpin(a.id, t.category, t.id);
      let i= {
        id:t.id, itemSpun:t.category, quote:t.quote, text:t.text, timestamp:Date.now()
      };
      sessionStorage.setItem(`session_spun_blessing_${a.id}`, JSON.stringify(i)), a.lock_duration!==`none`&&(localStorage.setItem(`spun_blessing_${a.id}`, JSON.stringify(i)), x(i)), y(!0)
    }else ae(), ee.current=requestAnimationFrame(()=>oe(e, t))
  }, se=()=> {
    if(p||s.length<2||!a)return;
    ie(), m(!0), y(!1);
    let e=(8+Math.floor(Math.random()*5))*(2*Math.PI);
    k.current=.25+Math.random()*.15, oe(A(a.theme_preset), e)
  }, ce=(e, t)=> {
    let n=t?` (${t})`:``, i=`🎉 Chúc mừng Lộc Lời Chúa nhận được từ ${r?.name||`Giáo xứ`}:\n\n🙏 "${e}"${n}\n\nKính chúc quý cộng đoàn một năm mới bình an và đầy ân sủng của Chúa!`;
    navigator.clipboard.writeText(i), ne(`Đã sao chép Lộc Lời Chúa!`)
  }, le=async()=> {
    let e=te.current;
    if(e) {
      ne(`Đang xuất ảnh thiệp...`);
      try {
        let t=(await(0, Vr.default)(e,  {
          useCORS:!0, backgroundColor:`#FFF8E8`, scale:2
        })).toDataURL(`image/png`), n=document.createElement(`a`);
        n.download=`Loc_Loi_Chua_${r?.slug||`giao_xu`}.png`, n.href=t, n.click(), ne(`Tải thiệp thành công!`)
      }catch(e) {
        console.error(e), ne(`Không thể xuất ảnh thiệp.`)
      }
    }
  }, N=()=> {
    b&&(g(s.find(e=>e.id===b.id)|| {
      id:b.id, wheel_id:a.id, category:b.itemSpun, quote:b.quote, text:b.text, is_custom:!0
    }), y(!0))
  };
  return l?(0, L.jsxs)(`div`,  {
    style: {
      display:`flex`, minHeight:`100vh`, alignItems:`center`, justifyContent:`center`, background:`var(--color-bg)`, gap:`8px`
    }, children:[(0, L.jsx)(Tr,  {
      className:`animate-spin`, size:24, style: {
        color:`var(--color-primary)`
      }
    }), (0, L.jsx)(`span`,  {
      style: {
        color:`var(--color-primary)`, fontWeight:`600`
      }, children:`Đang nhận diện Giáo xứ...`
    })]
  }):d||!a?(0, L.jsxs)(`div`,  {
    style: {
      display:`flex`, minHeight:`100vh`, flexDirection:`column`, alignItems:`center`, justifyContent:`center`, background:`var(--color-bg)`, gap:`16px`, padding:`24px`, textAlign:`center`
    }, children:[(0, L.jsx)(Mr,  {
      size:48, style: {
        color:`var(--color-error)`
      }
    }), (0, L.jsx)(`h3`,  {
      style: {
        fontSize:`18px`, color:`var(--color-text-dark)`, fontWeight:`700`
      }, children:d||`Đường dẫn không tồn tại.`
    }), (0, L.jsx)(`p`,  {
      style: {
        fontSize:`13px`, color:`var(--color-text-muted)`
      }, children:`Vui lòng liên hệ với Ban Truyền Thông Giáo xứ để nhận đường dẫn chính xác.`
    }), (0, L.jsx)(On,  {
      to:`/`, className:`btn btn-primary`, children:`Về Trang Chủ`
    })]
  }):(0, L.jsxs)(`div`,  {
    className:`public-layout`, children:[(0, L.jsxs)(`header`,  {
      className:`public-header`, children:[(0, L.jsx)(`div`,  {
        className:`public-logo`, children:(0, L.jsx)(mr,  {
          size:30
        })
      }), (0, L.jsx)(`div`,  {
        className:`public-parish-name`, children:r?.name
      }), (0, L.jsx)(`h2`,  {
        className:`public-event-title`, children:a.title
      }), (0, L.jsx)(`p`,  {
        className:`public-description`, children:b?`Bạn đã nhận Lộc Lời Chúa hôm nay. Mỗi người nhận một Lộc Thánh duy nhất.`:a.description||`Xin nhấn nút dưới đây để đón nhận ân sủng Lộc Lời Chúa dành riêng cho quý vị.`
      })]
    }), (0, L.jsx)(`div`,  {
      className:`wheel-wrapper`, children:(0, L.jsxs)(`div`,  {
        className:`wheel-container`, style: {
          borderColor:A(a.theme_preset)[0]
        }, children:[(0, L.jsx)(`canvas`,  {
          ref:E, id:`wheel-canvas`, width:`600`, height:`600`
        }), (0, L.jsx)(`div`,  {
          className:`wheel-pointer`, children:(0, L.jsx)(`svg`,  {
            viewBox:`0 0 30 30`, width:`40`, height:`40`, children:(0, L.jsx)(`polygon`,  {
              points:`5,15 25,5 25,25`, fill:A(a.theme_preset)[1], filter:`drop-shadow(2px 2px 2px rgba(0,0,0,0.3))`
            })
          })
        }), b?(0, L.jsx)(`button`,  {
          onClick:N, className:`spin-center-btn`, style: {
            background:`var(--color-gold)`, color:`var(--color-primary)`, borderColor:`var(--color-primary)`, fontSize:`11px`, fontWeight:`800`
          }, children:`XEM LỘC ĐÃ NHẬN`
        }):(0, L.jsx)(`button`,  {
          onClick:se, className:`spin-center-btn`, disabled:p||s.length<2, style: {
            background:A(a.theme_preset)[0], color:`#FFFFFF`, borderColor:A(a.theme_preset)[1]
          }, children:p?`ĐANG QUAY`:`QUAY LỘC`
        })]
      })
    }), b&&(0, L.jsx)(`div`,  {
      style: {
        textAlign:`center`, marginBottom:`24px`
      }, children:(0, L.jsxs)(`button`,  {
        onClick:N, className:`btn btn-outline`, style: {
          borderColor:`var(--color-primary)`, color:`var(--color-primary)`, gap:`6px`
        }, children:[(0, L.jsx)(mr,  {
          size:16
        }), `Xem lại Lộc Thánh của bạn`]
      })
    }), v&&h&&(0, L.jsx)(`div`,  {
      className:`modal-overlay`, onClick:()=>y(!1), children:(0, L.jsxs)(`div`,  {
        className:`winner-card`, onClick:e=>e.stopPropagation(), children:[(0, L.jsxs)(`div`,  {
          ref:te, className:`winner-export-container`, children:[(0, L.jsx)(`div`,  {
            className:`corner-ornament top-left`, style: {
              borderColor:A(a.theme_preset)[1]
            }
          }), (0, L.jsx)(`div`,  {
            className:`corner-ornament top-right`, style: {
              borderColor:A(a.theme_preset)[1]
            }
          }), (0, L.jsx)(`div`,  {
            className:`corner-ornament bottom-left`, style: {
              borderColor:A(a.theme_preset)[1]
            }
          }), (0, L.jsx)(`div`,  {
            className:`corner-ornament bottom-right`, style: {
              borderColor:A(a.theme_preset)[1]
            }
          }), (0, L.jsxs)(`div`,  {
            style: {
              border:`2px double ${A(a.theme_preset)[1]}`, borderRadius:`16px`, padding:`24px 16px`, display:`flex`, flexDirection:`column`, alignItems:`center`, textAlign:`center`
            }, children:[(0, L.jsxs)(`svg`,  {
              viewBox:`0 0 24 24`, width:`36`, height:`36`, style: {
                color:A(a.theme_preset)[1], marginBottom:`8px`
              }, children:[(0, L.jsx)(`path`,  {
                d:`M11 2h2v6h-2z`, fill:`currentColor`
              }), (0, L.jsx)(`path`,  {
                d:`M5 8h14v2H5z`, fill:`currentColor`
              }), (0, L.jsx)(`path`,  {
                d:`M11 10h2v12h-2z`, fill:`currentColor`
              })]
            }), (0, L.jsx)(`div`,  {
              className:`winner-parish-info`, style: {
                color:A(a.theme_preset)[0], fontWeight:700, fontSize:`11px`, letterSpacing:`1.5px`, textTransform:`uppercase`, marginBottom:`4px`
              }, children:r?.name
            }), (0, L.jsx)(`h2`,  {
              style: {
                fontFamily:`'Playfair Display', Georgia, serif`, fontSize:`22px`, fontWeight:800, color:A(a.theme_preset)[0], margin:`4px 0 12px 0`
              }, children:`LỘC LỜI CHÚA`
            }), (0, L.jsxs)(`div`,  {
              style: {
                display:`flex`, alignItems:`center`, width:`80%`, margin:`0 auto 16px auto`, gap:`8px`
              }, children:[(0, L.jsx)(`div`,  {
                style: {
                  height:`1px`, flex:1, background:`linear-gradient(to right, transparent, ${A(a.theme_preset)[1]}, transparent)`
                }
              }), (0, L.jsx)(`span`,  {
                style: {
                  color:A(a.theme_preset)[1], fontSize:`12px`
                }, children:`✦`
              }), (0, L.jsx)(`div`,  {
                style: {
                  height:`1px`, flex:1, background:`linear-gradient(to left, transparent, ${A(a.theme_preset)[1]}, transparent)`
                }
              })]
            }), (0, L.jsx)(`div`,  {
              style: {
                fontSize:`14px`, fontWeight:800, color:A(a.theme_preset)[1], background:`${A(a.theme_preset)[0]}12`, padding:`6px 16px`, borderRadius:`20px`, marginBottom:`16px`, border:`1px solid ${A(a.theme_preset)[1]}40`, textTransform:`uppercase`, letterSpacing:`0.5px`
              }, children:h.category
            }), (0, L.jsxs)(`p`,  {
              className:`blessing-text text-serif`, style: {
                fontSize:`17px`, lineHeight:`1.6`, color:`#1a1a1a`, fontStyle:`italic`, margin:`8px 0 12px 0`, padding:`0 8px`, minHeight:`60px`
              }, children:[`“ `, h.text, ` ”`]
            }), h.quote&&(0, L.jsxs)(`p`,  {
              style: {
                fontWeight:`700`, fontSize:`13.5px`, color:A(a.theme_preset)[0], marginTop:`4px`, marginBottom:`16px`
              }, children:[`— `, h.quote]
            }), (0, L.jsx)(`div`,  {
              style: {
                height:`1px`, width:`40%`, background:`linear-gradient(to right, transparent, ${A(a.theme_preset)[1]}50, transparent)`, margin:`0 auto 12px auto`
              }
            }), (0, L.jsxs)(`p`,  {
              style: {
                fontSize:`10.5px`, color:`var(--color-text-muted)`, fontStyle:`italic`, lineHeight:`1.4`, margin:0
              }, children:[`Kính chúc quý cộng đoàn một năm mới bình an,`, (0, L.jsx)(`br`,  {
                
              }), `đầy tràn ân sủng của Thiên Chúa!`]
            })]
          })]
        }), (0, L.jsxs)(`div`,  {
          style: {
            padding:`16px 24px 24px 24px`, display:`flex`, flexDirection:`column`, gap:`12px`, background:`#FFFFFF`, borderTop:`1px solid #eee`
          }, children:[(0, L.jsxs)(`div`,  {
            style: {
              display:`flex`, gap:`12px`, justifyContent:`center`
            }, children:[(0, L.jsxs)(`button`,  {
              onClick:()=>ce(h.text, h.quote), className:`copy-blessing-btn`, style: {
                flex:1, justifyContent:`center`, height:`40px`, borderRadius:`8px`, background:`rgba(15, 61, 46, 0.05)`, border:`1px solid rgba(15, 61, 46, 0.1)`
              }, children:[(0, L.jsx)(_r,  {
                size:14
              }), (0, L.jsx)(`span`,  {
                children:`Sao chép chữ`
              })]
            }), (0, L.jsxs)(`button`,  {
              onClick:le, className:`btn btn-primary`, style: {
                flex:1, height:`40px`, borderRadius:`8px`, background:A(a.theme_preset)[0], color:`#ffffff`
              }, children:[(0, L.jsx)(vr,  {
                size:14
              }), `Lưu ảnh Lộc`]
            })]
          }), (0, L.jsx)(`button`,  {
            onClick:()=>y(!1), className:`btn btn-secondary`, style: {
              width:`100%`, height:`40px`, borderRadius:`8px`, background:`#F3F4F6`, color:`#4B5563`, border:`none`
            }, children:`Đóng`
          })]
        })]
      })
    }), !S&&(0, L.jsx)(`div`,  {
      className:`footer-ad-banner`, style: {
        borderTopColor:A(a.theme_preset)[1]
      }, children:(0, L.jsxs)(`div`,  {
        className:`ad-content`, children:[(0, L.jsx)(`span`,  {
          className:`ad-logo-badge`, children:`Giờ Cha Chờ`
        }), (0, L.jsx)(`span`,  {
          className:`ad-text`, children:`Đồng hành cùng đức tin Công giáo. Tìm nhanh giờ Thánh Lễ & Giờ Xưng Tội gần nhất.`
        }), (0, L.jsx)(`a`,  {
          href:`https://play.google.com/store/apps/details?id=com.anonymous.churchfindernative`, target:`_blank`, rel:`noopener noreferrer`, className:`ad-link-btn`, children:`Tải miễn phí`
        }), (0, L.jsx)(`button`,  {
          onClick:()=>C(!0), className:`ad-close-btn`, title:`Đóng quảng cáo`, children:(0, L.jsx)(Nr,  {
            size:14
          })
        })]
      })
    }), w&&(0, L.jsx)(`div`,  {
      className:`toast-notification`, children:w
    })]
  })
}